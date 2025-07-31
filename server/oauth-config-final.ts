import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';
import { storage } from './storage';
import type { User } from '@shared/schema';

// OAuth configuration
const config = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback'
  },
  github: {
    clientID: process.env.G_CLIENT_ID!,
    clientSecret: process.env.G_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback'
  }
};

export function configureOAuth() {
  // Google OAuth Strategy - NO ADMIN ACCESS FOR OAUTH USERS
  if (config.google.clientID && config.google.clientSecret) {
    passport.use(new GoogleStrategy({
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
      try {
        // Check if user exists
        let user = await storage.getUserByProviderId('google', profile.id);
        
        if (!user) {
          // SECURITY: ALL OAuth users get 'user' role ONLY - NO ADMIN ACCESS
          const email = profile.emails?.[0]?.value;
          
          const userData = {
            id: `google_${profile.id}`,
            email: email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            username: profile.displayName || `user_${profile.id}`,
            profileImageUrl: profile.photos?.[0]?.value,
            provider: 'google',
            providerId: profile.id,
            role: 'user', // FORCED USER ROLE - NO ADMIN FOR OAUTH
            lastLogin: new Date(),
            isActive: true
          };
          
          user = await storage.upsertUser(userData);
          
          // Log audit event
          await storage.createAuditLog({
            userId: user.id,
            action: 'oauth_registration',
            resource: 'user',
            details: { 
              provider: 'google', 
              username: user.username,
              roleAssigned: 'user',
              securityNote: 'OAuth_users_cannot_be_admin'
            },
            severity: 'info'
          });
        } else {
          // SECURITY: Force ALL OAuth users to 'user' role on every login
          user = await storage.upsertUser({
            ...user,
            role: 'user', // FORCED USER ROLE - REMOVES ADMIN IF SOMEHOW ASSIGNED
            lastLogin: new Date()
          });
          
          // Log audit event
          await storage.createAuditLog({
            userId: user.id,
            action: 'oauth_login',
            resource: 'user',
            details: { 
              provider: 'google', 
              roleEnforced: 'user',
              securityNote: 'OAuth_users_forced_to_user_role'
            },
            severity: 'info'
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, false);
      }
    }));
  }

  // GitHub OAuth Strategy - NO ADMIN ACCESS FOR OAUTH USERS
  if (config.github.clientID && config.github.clientSecret) {
    passport.use(new GitHubStrategy({
      clientID: config.github.clientID,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackURL,
      scope: ['user:email']
    }, async (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
      try {
        // Check if user exists
        let user = await storage.getUserByProviderId('github', profile.id);
        
        if (!user) {
          // SECURITY: ALL OAuth users get 'user' role ONLY - NO ADMIN ACCESS
          const email = profile.emails?.[0]?.value;
          
          const userData = {
            id: `github_${profile.id}`,
            email: email,
            firstName: profile.name?.split(' ')[0],
            lastName: profile.name?.split(' ').slice(1).join(' '),
            username: profile.username || `user_${profile.id}`,
            profileImageUrl: profile.photos?.[0]?.value,
            provider: 'github',
            providerId: profile.id,
            role: 'user', // FORCED USER ROLE - NO ADMIN FOR OAUTH
            lastLogin: new Date(),
            isActive: true
          };
          
          user = await storage.upsertUser(userData);
          
          // Log audit event
          await storage.createAuditLog({
            userId: user.id,
            action: 'oauth_registration',
            resource: 'user',
            details: { 
              provider: 'github', 
              username: user.username,
              roleAssigned: 'user',
              securityNote: 'OAuth_users_cannot_be_admin'
            },
            severity: 'info'
          });
        } else {
          // SECURITY: Force all OAuth users to 'user' role on every login
          user = await storage.upsertUser({
            ...user,
            role: 'user', // FORCED USER ROLE - REMOVES ADMIN IF SOMEHOW ASSIGNED
            lastLogin: new Date()
          });
          
          // Log audit event
          await storage.createAuditLog({
            userId: user.id,
            action: 'oauth_login',
            resource: 'user',
            details: { 
              provider: 'github', 
              roleEnforced: 'user',
              securityNote: 'OAuth_users_forced_to_user_role'
            },
            severity: 'info'
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('GitHub OAuth error:', error);
        return done(error, false);
      }
    }));
  }

  // Passport serialize/deserialize
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (error) {
      done(error, false);
    }
  });
}

export { config as oauthConfig };