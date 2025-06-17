
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import { onAuthStateChanged, getAuth, type Auth } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [siteAuthor, setSiteAuthor] = useState('');
  const [apiKey1, setApiKey1] = useState('');
  const [apiKey2, setApiKey2] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [twitterCard, setTwitterCard] = useState('');
  const [twitterTitle, setTwitterTitle] = useState('');
  const [twitterDescription, setTwitterDescription] = useState('');
  const [twitterImage, setTwitterImage] = useState('');
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('');
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState('');
  const [firebaseAppId, setFirebaseAppId] = useState('');
  const [firebaseMeasurementId, setFirebaseMeasurementId] = useState('');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [loading, setLoading] = useState(true); // Loading state
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const firestore: Firestore = getFirestore(auth.app); // Get Firestore instance
  const firebaseAuth: Auth = getAuth(auth.app); // Get Auth instance

  const settingsDocRef = doc(firestore, 'settings', 'websiteSettings'); // Reference to the settings document

  const fetchSettings = async () => {
    try {
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSiteName(data.siteName || '');
        setSiteKeywords(data.siteKeywords || '');
        setSiteDescription(data.siteDescription || '');
        setCanonicalUrl(data.canonicalUrl || '');
        setSiteAuthor(data.siteAuthor || '');
        setApiKey1(data.apiKey1 || '');
        setApiKey2(data.apiKey2 || '');
        setOgTitle(data.ogTitle || '');
        setOgDescription(data.ogDescription || '');
        setOgImage(data.ogImage || '');
        setTwitterCard(data.twitterCard || '');
        setTwitterTitle(data.twitterTitle || '');
        setTwitterDescription(data.twitterDescription || '');
        setTwitterImage(data.twitterImage || '');
        setFirebaseApiKey(data.firebaseApiKey || '');
        setFirebaseAuthDomain(data.firebaseAuthDomain || '');
        setFirebaseProjectId(data.firebaseProjectId || '');
        setFirebaseStorageBucket(data.firebaseStorageBucket || '');
        setFirebaseMessagingSenderId(data.firebaseMessagingSenderId || '');
        setFirebaseAppId(data.firebaseAppId || '');
        setFirebaseMeasurementId(data.firebaseMeasurementId || '');
        setGoogleMapsApiKey(data.googleMapsApiKey || '');
        setPaypalClientId(data.paypalClientId || '');
        setStripePublishableKey(data.stripePublishableKey || '');
      } else {
        console.log("No settings document found, using defaults.");
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true);
    const settingsToSave = {
      siteName,
      siteDescription,
      siteKeywords,
      siteAuthor,
      canonicalUrl,
      apiKey1,
      apiKey2,
      ogTitle,
      ogDescription,
      ogImage,
      twitterCard,
      twitterTitle,
      twitterDescription,
      twitterImage,
      firebaseApiKey,
      firebaseAuthDomain,
      firebaseProjectId,
      firebaseStorageBucket,
      firebaseMessagingSenderId,
      firebaseAppId,
      firebaseMeasurementId,
      adminEmail,
 googleMapsApiKey,
 paypalClientId,
 stripePublishableKey,
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
    fetchSettings().catch(console.error); // Fetch settings on component mount
  }, []); // Empty dependency array means this effect runs once on mount


  
  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Настройки на сайта</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-10">
              Зареждане на настройки...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Име на сайта</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Описание на сайта</Label>
                <Input
                  id="siteDescription"
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteKeywords">Ключови думи на сайта</Label>
                <Input
                  id="siteKeywords"
                  value={siteKeywords}
                  onChange={(e) => setSiteKeywords(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteAuthor">Автор на сайта</Label>
                <Input
                  id="siteAuthor"
                  value={siteAuthor}
                  onChange={(e) => setSiteAuthor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Имейл на администратора</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  type="url"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="Например: https://www.yourwebsite.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey1">API Ключ 1 (Placeholder)</Label>
                <Input
                  id="apiKey1"
                  type="text"
                  value={apiKey1}
                  onChange={(e) => setApiKey1(e.target.value)}
                  placeholder="Въведете API Ключ 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey2">API Ключ 2 (Placeholder)</Label>
                <Input
                  id="apiKey2"
                  type="text"
                  value={apiKey2}
                  onChange={(e) => setApiKey2(e.target.value)}
                  placeholder="Въведете API Ключ 2"
                />
              </div>
              {/* Add more form fields for API keys or other settings */}
              <div className="space-y-2">
                <Label htmlFor="ogTitle">Open Graph Title</Label>
                <Input
                  id="ogTitle"
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogDescription">Open Graph Description</Label>
                <Input
                  id="ogDescription"
                  type="text"
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">Open Graph Image URL</Label>
                <Input
                  id="ogImage"
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterCard">Twitter Card Type</Label>
                <Input
                  id="twitterCard"
                  type="text"
                  value={twitterCard}
                  onChange={(e) => setTwitterCard(e.target.value)}
                  placeholder="e.g., summary_large_image"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterTitle">Twitter Title</Label>
                <Input
                  id="twitterTitle"
                  type="text"
                  value={twitterTitle}
                  onChange={(e) => setTwitterTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterDescription">Twitter Description</Label>
                <Input
                  id="twitterDescription"
                  type="text"
                  value={twitterDescription}
                  onChange={(e) => setTwitterDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterImage">Twitter Image URL</Label>
                <Input
                  id="twitterImage"
                  type="text"
                  value={twitterImage}
                  onChange={(e) => setTwitterImage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseApiKey">
                  Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY)
                </Label>
                <Input
                  id="firebaseApiKey"
                  type="text"
                  value={firebaseApiKey}
                  onChange={(e) => setFirebaseApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseAuthDomain">
                  Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
                </Label>
                <Input
                  id="firebaseAuthDomain"
                  type="text"
                  value={firebaseAuthDomain}
                  onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseProjectId">
                  Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID)
                </Label>
                <Input
                  id="firebaseProjectId"
                  type="text"
                  value={firebaseProjectId}
                  onChange={(e) => setFirebaseProjectId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseStorageBucket">
                  Firebase Storage Bucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
                </Label>
                <Input
                  id="firebaseStorageBucket"
                  type="text"
                  value={firebaseStorageBucket}
                  onChange={(e) => setFirebaseStorageBucket(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseMessagingSenderId">
                  Firebase Messaging Sender ID (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
                </Label>
                <Input
                  id="firebaseMessagingSenderId"
                  type="text"
                  value={firebaseMessagingSenderId}
                  onChange={(e) => setFirebaseMessagingSenderId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseAppId">
                  Firebase App ID (NEXT_PUBLIC_FIREBASE_APP_ID)
                </Label>
                <Input
                  id="firebaseAppId"
                  type="text"
                  value={firebaseAppId}
                  onChange={(e) => setFirebaseAppId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firebaseMeasurementId">
                  Firebase Measurement ID (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)
                </Label>
                <Input
                  id="firebaseMeasurementId"
                  type="text"
                  value={firebaseMeasurementId}
                  onChange={(e) => setFirebaseMeasurementId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalClientId">
                  PayPal Client ID (NEXT_PUBLIC_PAYPAL_CLIENT_ID)
                </Label>
                <Input
                  id="paypalClientId"
                  type="text"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripePublishableKey">
                  Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
                </Label>
                <Input
                  id="stripePublishableKey"
                  type="text"
                  value={stripePublishableKey}
                  onChange={(e) => setStripePublishableKey(e.target.value)}
                />
              </div>
              {/* Add Google Maps API Key field */}
              <div className="space-y-2">
                <Label htmlFor="googleMapsApiKey">
                  Google Maps API Key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
                </Label>
                <Input
                  id="googleMapsApiKey"
                  type="text"
                  value={googleMapsApiKey}
                  onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                Запази Промените
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
