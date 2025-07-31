import React from 'react';
import { UserGithubSettings } from '@/components/UserGithubSettings';
import { UserProfileSettings } from '@/components/UserProfileSettings';
import { UserSecuritySettings } from '@/components/UserSecuritySettings';
import { UserNotificationSettings } from '@/components/UserNotificationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, User, Github, Shield, Bell } from 'lucide-react';

export default function Settings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            User Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account preferences and integrations
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <UserProfileSettings />
          </TabsContent>

          <TabsContent value="github" className="space-y-6">
            <UserGithubSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <UserSecuritySettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <UserNotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}