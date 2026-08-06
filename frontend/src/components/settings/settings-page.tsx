"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/components/language-provider";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Moon, Shield, Globe } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

interface SettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
}

export function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: false,
    language: "id",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, [session]);

  useEffect(() => {
    // Sync language with language provider only on initial load
    if (settings.language && mounted) {
      setLanguage(settings.language as any);
    }
  }, [mounted]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/settings`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        // Sync theme with settings
        if (data.data.darkMode) {
          setTheme("dark");
        } else {
          setTheme("light");
        }
      }
    } catch (error) {
      // Use default settings if API fails, but sync with localStorage for language
      const savedLanguage = typeof window !== "undefined" ? localStorage.getItem("language") : "id";
      setSettings({
        emailNotifications: true,
        pushNotifications: true,
        darkMode: false,
        language: savedLanguage || "id",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/auth/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(t("saved"));
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast.error(error.message || t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDarkModeChange = (checked: boolean) => {
    setSettings({ ...settings, darkMode: checked });
    setTheme(checked ? "dark" : "light");
  };

  const handleLanguageChange = (newLanguage: string) => {
    setSettings({ ...settings, language: newLanguage });
    setLanguage(newLanguage as any);
  };

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t("settings")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("settingsDescription")}
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            {t("notifications")}
          </CardTitle>
          <CardDescription>
            {t("notificationsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">{t("emailNotifications")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("emailNotificationsDesc")}
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">{t("pushNotifications")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("pushNotificationsDesc")}
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, pushNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="size-5" />
            {t("appearance")}
          </CardTitle>
          <CardDescription>
            {t("appearanceDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">{t("darkMode")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("darkModeDesc")}
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={handleDarkModeChange}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="language">{t("language")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("languageDesc")}
            </p>
            <select
              id="language"
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            {t("security")}
          </CardTitle>
          <CardDescription>
            {t("securityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-0.5">
            <Label>{t("securityStatus")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("securityStatusDesc")}
            </p>
          </div>
          <Separator />
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Globe className="size-4" />
              {t("privacy")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("privacyDesc")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("saveSettings")}
        </Button>
      </div>
    </div>
  );
}
