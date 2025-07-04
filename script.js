const API_URL = "https://77561ad7-df83-461f-b85c-1bbe35dc3134-00-qpnclpg87cfg.picard.replit.dev/validate";

const patterns = {
  "1": { desc: "X_XXX", gen: () => `${randomUpper()}_${randomUpper(3)}` },
  "2": { desc: "XX_XX", gen: () => `${randomUpper(2)}_${randomUpper(2)}` },
  "3": { desc: "XXX_X", gen: () => `${randomUpper(3)}_${randomUpper()}` },
  "4": { desc: "1_X2X", gen: () => genPatDigit(`${randChar()}_${randChar(true)}${randDigit()}${randChar(true)}`) },
  "5": { desc: "1X_2X", gen: () => genPatDigit(`${randChar()}${randChar(true)}_${randDigit()}${randChar(true)}`) },
  "6": { desc: "1X2_X", gen: () => genPatDigit(`${randChar()}${randChar(true)}${randDigit()}_${randChar(true)}`) },
  "7": { desc: "X1X2X", gen: () => genPatDigit(null, true) },
};

function randomUpper(len=1) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let s = "";
  for(let i=0; i<len; i++) s += letters.charAt(Math.floor(Math.random() * letters.length));
  return s;
}

function randDigit() {
  return Math.floor(Math.random() * 10).toString();
}

function randChar(allowDigits=false) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  if (allowDigits) {
    const all = letters + digits;
    return all.charAt(Math.floor(Math.random() * all.length));
  } else {
    return letters.charAt(Math.floor(Math.random() * letters.length));
  }
}

function genPatDigit(val=null, strict=false) {
  while(true) {
    if (val === null) {
      val = randomUpper(5) + Math.floor(Math.random() * 10);
    }
    const hasDigit = [...val].some(c => /\d/.test(c));
    const hasAlpha = [...val].some(c => /[A-Z]/.test(c));
    if (hasDigit && (!strict || hasAlpha)) return val;
    val = randomUpper(5) + Math.floor(Math.random() * 10);
  }
}

function genFromFmt(fmt) {
  return [...fmt].map(c => {
    if (c === 'L') return randomUpper();
    if (c === 'D') return randDigit();
    return c;
  }).join('');
}

function showExamples() {
  const select = document.getElementById("patternSelect");
  for(let i=1; i<=7; i++) {
    let p = patterns[i.toString()];
    if(p) {
      let ex1 = p.gen();
      let ex2 = p.gen();
      select.querySelector(`option[value="${i}"]`).textContent = `${p.desc} (e.g. ${ex1}, ${ex2})`;
    }
  }
}
showExamples();

const startBtn = document.getElementById("startBtn");
const resultsDiv = document.getElementById("results");
const patternSelect = document.getElementById("patternSelect");
const customPatternInput = document.getElementById("customPatternInput");
const customPatternContainer = document.getElementById("customPatternContainer");
const fileInputContainer = document.getElementById("fileInputContainer");
const fileInput = document.getElementById("fileInput");

patternSelect.addEventListener("change", () => {
  const val = patternSelect.value;
  if(val === "8") {
    customPatternContainer.style.display = "block";
    fileInputContainer.style.display = "none";
  } else if(val === "9") {
    customPatternContainer.style.display = "none";
    fileInputContainer.style.display = "block";
  } else {
    customPatternContainer.style.display = "none";
    fileInputContainer.style.display = "none";
  }
});

let validList = [];
let takenList = [];
let censoredList = [];

startBtn.addEventListener("click", async () => {
  resultsDiv.textContent = "";
  validList = [];
  takenList = [];
  censoredList = [];

  let usernames = [];
  const choice = patternSelect.value;
  const number = parseInt(document.getElementById("numberInput").value) || 10;

  if (choice === "9") {
    const files = fileInput.files;
    if (!files.length) {
      alert("Please select a .txt file");
      return;
    }
    const text = await files[0].text();
    usernames = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  } else if (choice === "8") {
    const fmt = customPatternInput.value.trim().toUpperCase();
    if (!fmt.match(/^[LD_]+$/)) {
      alert("Invalid custom pattern. Use only L, D, and _");
      return;
    }
    for (let i = 0; i < number; i++) {
      usernames.push(genFromFmt(fmt));
    }
  } else if (patterns[choice]) {
    for (let i = 0; i < number; i++) {
      usernames.push(patterns[choice].gen());
    }
  } else {
    alert("Invalid pattern choice");
    return;
  }

  resultsDiv.textContent = "Checking usernames...\n";
  for(let i=0; i<usernames.length; i++) {
    const name = usernames[i];
    resultsDiv.textContent += `Checking ${name}... `;
    const code = await checkUsername(name);
    if(code === 0) {
      validList.push(name);
      resultsDiv.innerHTML += `<span class="valid">[VALID]</span> Username valid: ${name}\n`;
    } else if(code === 1) {
      takenList.push(name);
      resultsDiv.innerHTML += `<span class="taken">[TAKEN]</span> Username taken: ${name}\n`;
    } else if(code === 2) {
      censoredList.push(name);
      resultsDiv.innerHTML += `<span class="censored">[CENSORED]</span> Username censored: ${name}\n`;
    } else {
      resultsDiv.innerHTML += `[ERROR] Unknown response for ${name}\n`;
    }
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
  }
  resultsDiv.innerHTML += `\nDone! Results:\nValid: ${validList.length}\nTaken: ${takenList.length}\nCensored: ${censoredList.length}`;
});

async function checkUsername(username) {
  try {
    const res = await fetch(`${API_URL}?username=${encodeURIComponent(username)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.code;
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

function download(filename, text) {
  const blob = new Blob([text], {type: "text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("downloadValid").onclick = () => {
  if (validList.length === 0) alert("No valid usernames to download!");
  else download("valid.txt", validList.join("\n"));
};
document.getElementById("downloadTaken").onclick = () => {
  if (takenList.length === 0) alert("No taken usernames to download!");
  else download("taken.txt", takenList.join("\n"));
};
document.getElementById("downloadCensored").onclick = () => {
  if (censoredList.length === 0) alert("No censored usernames to download!");
  else download("censored.txt", censoredList.join("\n"));
};
