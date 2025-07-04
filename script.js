const API_URL = "https://77561ad7-df83-461f-b85c-1bbe35dc3134-00-qpnclpg87cfg.picard.replit.dev/validate";

async function checkUsername() {
  const input = document.getElementById("usernameInput");
  const result = document.getElementById("result");
  const username = input.value.trim();

  if (!username) {
    result.textContent = "Please enter a username.";
    return;
  }

  result.textContent = "Checking...";

  try {
    const res = await fetch(`${API_URL}?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    switch (data.code) {
      case 0:
        result.textContent = `✅ Username is valid: ${username}`;
        result.style.color = "green";
        break;
      case 1:
        result.textContent = `❌ Username is taken: ${username}`;
        result.style.color = "gray";
        break;
      case 2:
        result.textContent = `🚫 Username is censored: ${username}`;
        result.style.color = "red";
        break;
      default:
        result.textContent = `⚠️ Unknown response: ${JSON.stringify(data)}`;
        result.style.color = "orange";
    }
  } catch (err) {
    result.textContent = "❌ Error checking username.";
    result.style.color = "red";
    console.error(err);
  }
}
