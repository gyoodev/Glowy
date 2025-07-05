
✨ Glaura – Salon Management Platform

Glaura is a comprehensive salon management platform that streamlines appointment bookings, service management, customer reviews, and leverages AI to generate compelling salon descriptions and personalized user recommendations. 


---

## 🚀 Features

- **Appointment Scheduling**: Effortlessly book and manage salon appointments.
- **Service Management**: Organize and customize salon services with ease.
- **Customer Reviews**: Collect and display client feedback to build trust.
- **AI-Generated Descriptions**: Utilize AI to craft engaging salon descriptions.
- **Personalized Recommendations**: Offer tailored suggestions to users based on their preferences. 

---

## 🛠️ Technologies Used

- **Next.js**: Framework for building the user interface.
- **Firebase**: Backend services including authentication (Firebase Authentication) and database (Firestore).
- **ImageBB**: Image hosting service.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **TypeScript**: Typed superset of JavaScript for improved developer experience.
- **Netlify**: Deployment and hosting platform.

---

## 📦 Installation & Configuration

**This is the most important step. The application will not run without proper configuration.**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gyoodev/Glowy.git
    cd Glowy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    -   In the project's root directory, find the file named `.env.local.example`.
    -   Make a copy of this file and rename it to `.env.local`. **This file is ignored by Git and should not be shared.**
    -   Open `.env.local` and fill in the values with your actual credentials.

4.  **Set up Firebase Credentials:**
    -   You can find your Firebase client-side keys in your Firebase project settings under "General". Fill in all `NEXT_PUBLIC_FIREBASE_*` variables.

5.  **Set up Google Maps API Key:**
    -   The application uses Google Maps to convert addresses into map coordinates.
    -   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    -   Create a new project or select an existing one.
    -   In the navigation menu, go to "APIs & Services" > "Library".
    -   Search for and **enable** the **Geocoding API**.
    -   Go to "APIs & Services" > "Credentials".
    -   Click "Create credentials" and select "API key".
    -   Copy the generated API key and paste it into `.env.local` for the `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` variable.
    -   **Important**: For security, it's highly recommended to restrict your API key. You can restrict it to your website's domain and to only be used for the Geocoding API.

6.  **Set up ImageBB API Key:**
    -   For ImageBB, go to [https://api.imgbb.com/](https://api.imgbb.com/) to get your free API key for the `NEXT_PUBLIC_IMAGEBB_API_KEY` variable.

7.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open http://localhost:9002 to view the application.

## Troubleshooting

- **"CRITICAL ERROR: Firebase environment variables are not correctly set."**
  - This error means your `.env.local` file is missing or the keys inside it are incorrect.
  - Please double-check that you have completed steps 3, 4, 5, and 6 of the "Installation & Configuration" section correctly.

---

## 📁 Project Structure

```
Glowy/
├── .tmp/                 # Temporary files
├── .vscode/              # VSCode settings
├── docs/                 # Documentation
├── src/                  # Source code
├── utils/                # Utility functions
├── public/               # Static assets
├── components.json       # Component configurations
├── firestore.rules       # Firebase security rules
├── netlify.toml          # Netlify deployment settings
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project metadata and scripts
└── README.md             # Project overview
```

---

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your enhancements. For major changes, open an issue first to discuss your ideas. 

---

## 📄 License

This project is licensed under the MIT License. 

---

## 🌐 Live Demo

Check out the live application: [Glowy on Netlify](https://glowy.netlify.app/)

---

Feel free to customize this README further to match your project's branding and specific details.
