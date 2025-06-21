export const emailTemplate = `<!DOCTYPE html>
<html lang="bg">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Glaura – Открий своя блясък</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f6ff;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(140, 89, 242, 0.1);
    }
    .header {
      background-color: #8c59f2;
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 30px 20px;
    }
    .content h2 {
      color: #8c59f2;
    }
    .cta-button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #8c59f2;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      margin-top: 20px;
      font-weight: bold;
    }
    .offer {
      background-color: #f0eaff;
      padding: 20px;
      border-left: 4px solid #8c59f2;
      margin: 30px 0;
      border-radius: 8px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      padding: 20px;
      color: #777;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 20px 15px;
      }
      .header {
        padding: 20px 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Открий своя блясък с Glaura</h1>
      <p>Намерете салони наблизо с един клик ✅</p>
    </div>

    <div class="content">
      <h2>Здравей 👋</h2>
      <p>{bodyContent}</p>

      {button}

      <p style="margin-top: 30px;">
        С обич към твоята красота,<br />
        Екипът на <strong>Glaura</strong> ✨
      </p>

      <p>
        <em>P.S. Собственик на салон си?</em><br />
        <a href="https://glaura.eu/register" style="color:#8c59f2; text-decoration: underline;">Присъедини се към Glaura и достигни до нови клиенти безплатно</a>
      </p>
    </div>

    <div class="footer">
      © 2025 Glaura. Всички права запазени.
      <br />Сaйт: <a href="https://glaura.eu" style="color:#8c59f2;">Glaura.eu</a>
    </div>
  </div>
</body>
</html>
`;