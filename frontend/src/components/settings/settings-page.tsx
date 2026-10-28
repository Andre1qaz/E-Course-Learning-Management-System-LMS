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

const SETTINGS_STORAGE_KEY = "user-settings";

interface SettingsData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
}

const defaultSettings: SettingsData = {
  emailNotifications: true,
  pushNotifications: true,
  darkMode: false,
  language: "id",
};

function readStoredSettings(): SettingsData {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = JSON.parse(raw) as Partial<SettingsData>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

export function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Settings are persisted per user in localStorage so they survive reloads
    // without requiring a dedicated backend endpoint.
    const storageKey = session?.user?.email
      ? `${SETTINGS_STORAGE_KEY}:${session.user.email}`
      : SETTINGS_STORAGE_KEY;
    let stored: SettingsData;
    try {
      const raw = localStorage.getItem(storageKey);
      stored = raw
        ? { ...defaultSettings, ...(JSON.parse(raw) as Partial<SettingsData>) }
        : readStoredSettings();
    } catch {
      stored = readStoredSettings();
    }

    // The language provider is the source of truth for the active language.
    setSettings(stored);
    setLoading(false);
  }, [session?.user?.email]);

  // Keep the select in sync if the language is changed elsewhere (e.g. navbar).
  useEffect(() => {
    setSettings((prev) =>
      prev.language === language ? prev : { ...prev, language },
    );
  }, [language]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const storageKey = session?.user?.email
        ? `${SETTINGS_STORAGE_KEY}:${session.user.email}`
        : SETTINGS_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(settings));
      setLanguage(settings.language as "id" | "en");
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
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
    setLanguage(newLanguage as "id" | "en");
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
