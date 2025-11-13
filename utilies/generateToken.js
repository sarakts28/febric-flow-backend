import jwt from "jsonwebtoken";

const generateAuthToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "60m" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

export { generateAuthToken, generateRefreshToken };
