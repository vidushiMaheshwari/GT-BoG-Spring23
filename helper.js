import jwt from 'jsonwebtoken';
import { query, limit, startAfter, orderBy } from 'firebase/firestore';

/**
 * @param req to extract token
 * @returns false if token is invalid, else the decoded data.
 */

export function validateToken(req) {
  let token = req.headers.authorization;
  if (token) {
    token = token.split(" ")[1];
    const decode = jwt.verify(token, `${process.env.JWT_SECRET_KEY}`);
    if (Date.now() >= decode.exp * 1000) {
      return false;
    }
    return decode;
  }
  return false;
}

export function getQueries(lastPage, collection, lim, orderCol) {
  let q;
  if (lastPage === null || lastPage === undefined) {
    q = query(collection, orderBy(`${orderCol}`, "desc"), limit(lim));
  } else {
    q = query(
      collection,
      orderBy(`${orderCol}`, "desc"),
      startAfter(lastPage),
      limit(lim)
    );
  }
  return q;
}

export const collName = {
  USER: "User",
  ANIMAL: "Animal",
  TRAIN: "Training",
};
