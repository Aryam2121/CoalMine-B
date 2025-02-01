import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: 'http://localhost:3000/auth/google/callback'
},
function(accessToken, refreshToken, profile, done) {
  // Here you would find or create a user in your database
  return done(null, profile);
}));

export default passport;
