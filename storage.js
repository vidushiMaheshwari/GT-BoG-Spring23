import Multer from "multer";
import {bucket} from './db.js';

export const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadHandler = (file, filename) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject("No file. Please put a file.");
      return;
    }

    let fileUpload = bucket.file(`${filename}`);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      reject(error.message);
    });

    blobStream.on("finish", () => {
      const url = (
        `https://storage.googleapis.com/${bucket.name}/${filename}`
      );
      resolve(url);
    });

    blobStream.end(file.buffer);
  });
};
