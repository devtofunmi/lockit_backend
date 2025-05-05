import CryptoJS from 'crypto-js';
import { prisma } from '../../prisma/prismaClient.js';

// Encrypt the message using AES
const encryptMessage = (message: string, key: string) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

// Decrypt the message using AES
const decryptMessage = (encryptedMessage: string, key: string) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Create a new message
const createMessage = async (
  content: string,
  expirationMinutes: number | null,
  burnAfterReading: boolean,
  password: string | null
) => {
  const encryptedMessage = encryptMessage(content, password || 'default_secret_key');

  const newMessage = await prisma.message.create({
    data: {
      message: encryptedMessage,
      expirationMinutes: expirationMinutes ?? null,
      burnAfterReading,
    },
  });

  return newMessage;
};

// Get and decrypt a message
const getMessage = async (id: string, password: string | null) => {
  const message = await prisma.message.findUnique({
    where: { id },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Check expiration
  if (message.expirationMinutes !== null) {
    const expirationTime = new Date(message.createdAt.getTime() + message.expirationMinutes * 60000);
    if (new Date() > expirationTime) {
      await prisma.message.delete({ where: { id } });
      throw new Error('Message has expired');
    }
  }

  let decrypted;
  try {
    decrypted = decryptMessage(message.message, password || 'default_secret_key');
  } catch {
    throw new Error('Incorrect password or message corrupt');
  }

  if (!decrypted) {
    throw new Error('Incorrect password or message corrupt');
  }

  if (message.burnAfterReading) {
    await prisma.message.delete({ where: { id } });
  }

  return decrypted;
};

export { createMessage, getMessage };