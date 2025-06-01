
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [apiKey1, setApiKey1] = useState('');
  const [apiKey2, setApiKey2] = useState('');
  const [loading, setLoading] = useState(true); // Loading state

  const firestore = getFirestore(auth.app); // Get Firestore instance
  const settingsDocRef = doc(firestore, 'settings', 'websiteSettings'); // Reference to the settings document

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    const settingsToSave = {
      siteName,
      siteDescription,
      adminEmail,
      apiKey1,
      apiKey2,
    };
    // Add success/error feedback

    try {
      await setDoc(settingsDocRef, settingsToSave);
      console.log('Settings saved successfully!');
      // Optionally show a success toast
    } catch (error) {
      console.error('Error saving settings:', error);
      // Optionally show an error toast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSiteName(data.siteName || '');
          setSiteDescription(data.siteDescription || '');
          setAdminEmail(data.adminEmail || '');
          setApiKey1(data.apiKey1 || '');
          setApiKey2(data.apiKey2 || '');
          // Set other state variables if you add more settings
        } else {
          console.log("No settings document found, using defaults.");
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [settingsDocRef]); // Depend on the settings document reference

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Настройки на сайта</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-10">Зареждане на настройки...</div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Име на сайта</Label>
            <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="siteDescription">Описание на сайта</Label>
            <Input id="siteDescription" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Имейл на администратора</Label>
            <Input id="adminEmail" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          </div>
          {/* Add more form fields for API keys or other settings */}
          <div className="space-y-2">
            <Label htmlFor="apiKey1">API Ключ 1 (Placeholder)</Label>
            <Input id="apiKey1" type="text" value={apiKey1} onChange={(e) => setApiKey1(e.target.value)} placeholder="Въведете API Ключ 1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey2">API Ключ 2 (Placeholder)</Label>
            <Input id="apiKey2" type="text" value={apiKey2} onChange={(e) => setApiKey2(e.target.value)} placeholder="Въведете API Ключ 2" />
          </div>
          {/* ... Add other settings fields here */}
          <Button type="submit" disabled={loading}>Запази Промените</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
