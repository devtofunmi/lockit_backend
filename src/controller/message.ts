// controller
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

export const createMessage = async (
  message: string,
  expirationMinutes: number | null,
  burnAfterReading: boolean,
  password: string | null
) => {
  if (!message) {
    throw new Error('Content is required'); // This is where your error is coming from!
  }

  console.log('Incoming values:', {
    message,
    expirationMinutes,
    burnAfterReading,
    password,
  });

  const key = password || 'default_secret_key';
  const encrypted = encryptMessage(message, key);

  const newMessage = await prisma.message.create({
    data: {
      message: encrypted,
      expirationMinutes: expirationMinutes ?? null,
      burnAfterReading,
      password: password ? true : false,
    },
  });
  

  console.log('Data going into Prisma:', {
    message: encrypted,
    expirationMinutes,
    burnAfterReading,
    password: password ? true : false,
  });
  
  return newMessage;
};




export const getMessage = async (id: string, password: string | null) => {
  const message = await prisma.message.findUnique({ where: { id } });

  if (!message) throw new Error('Message not found');

  // Check for message expiration
  if (message.expirationMinutes !== null) {
    const expirationTime = new Date(message.createdAt.getTime() + message.expirationMinutes * 60000);
    if (new Date() > expirationTime) {
      await prisma.message.delete({ where: { id } });
      throw new Error('Message has expired');
    }
  }

  // Decrypt the message
  const decrypted = decryptMessage(message.message, password || 'default_secret_key');
  if (!decrypted) throw new Error('Incorrect password or message is corrupted');

  // Handle burn-after-reading functionality
  if (message.burnAfterReading) {
    await prisma.message.delete({ where: { id } });
  }

  return decrypted;
};
