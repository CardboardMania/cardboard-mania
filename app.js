const firebaseConfig = {
  apiKey: "AIzaSyD1_f5mkPPdPF0bZcJQT69gWX8KdAHR4c8",
  authDomain: "cardboard-mania.firebaseapp.com",
  projectId: "cardboard-mania",
  storageBucket: "cardboard-mania.firebasestorage.app",
  messagingSenderId: "940513136308",
  appId: "1:940513136308:web:51ea71edd7a13d8f9ad1e1",
  measurementId: "G-SQP6ZRYM3W"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let allCards = [];

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email.includes("@")) return alert("Invalid email format.");
  auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email.includes("@")) return alert("Invalid email format.");
  if (password.length < 6) return alert("Password must be at least 6 characters.");
  auth.createUserWithEmailAndPassword(email, password).catch(err => alert(err.message));
}

auth.onAuthStateChanged(user => {
  if (user) {
    loadCards(user.uid);
  } else {
    document.getElementById("cardList").innerHTML = "";
    allCards = [];
  }
});

function addCard() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in.");

  const data = {
    folder: document.getElementById("folder").value,
    cardName: document.getElementById("cardName").value,
    cardType: document.getElementById("cardType").value,
    condition: document.getElementById("condition").value,
    purchasePrice: parseFloat(document.getElementById("purchasePrice").value),
    ebaySearch: document.getElementById("ebaySearch").value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const file = document.getElementById("cardImage").files[0];

  if (file) {
    const ref = storage.ref("cards/" + user.uid + "/" + file.name);
    ref.put(file)
      .then(snap => snap.ref.getDownloadURL())
      .then(url => {
        data.imageUrl = url;
        db.collection("users").doc(user.uid).collection("cards").add(data);
      });
  } else {
    db.collection("users").doc(user.uid).collection("cards").add(data);
  }

  clearForm();
}

function clearForm() {
  document.getElementById("folder").value = "";
  document.getElementById("cardName").value = "";
  document.getElementById("cardType").value = "";
  document.getElementById("condition").value = "";
  document.getElementById("purchasePrice").value = "";
  document.getElementById("ebaySearch").value = "";
  document.getElementById("cardImage").value = "";
  document.getElementById("preview").style.display = "none";
}

function loadCards(uid) {
  db.collection("users").doc(uid).collection("cards")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      allCards = [];
      snapshot.forEach(doc => {
        let card = doc.data();
        card.id = doc.id;
        allCards.push(card);
      });
      renderCards(allCards);
    });
}

function renderCards(cards) {
  const list = document.getElementById("cardList");
  list.innerHTML = "";
  cards.forEach(d => {
    const priceInfo = `<p>eBay price: <span id="ebay-price-${d.id}">Loading...</span></p>
                       <p>Goldin price: <span id="goldin-price-${d.id}">Loading...</span></p>`;

    list.innerHTML += `
      <div class="card">
        <button class="delete-btn" onclick="deleteCard('${d.id}')">Delete</button>
        <h3>${d.cardName}</h3>
        <p>${d.cardType} - $${d.purchasePrice}</p>
        <p>Condition: ${d.condition}</p>
        <p>Folder: ${d.folder}</p>
        <a href='https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(d.ebaySearch)}' target='_blank'>eBay Search</a>
        ${d.imageUrl ? `<img src='${d.imageUrl}' class='preview'>` : ""}
        ${priceInfo}
      </div>
    `;

    fetchEbayPrice(d.ebaySearch, d.id);
    fetchGoldinPrice(d.ebaySearch, d.id);
  });
}

function deleteCard(cardId) {
  const user = auth.currentUser;
  if (!user) return alert("Please log in.");

  db.collection("users").doc(user.uid).collection("cards").doc(cardId).delete()
    .catch(err => alert(err.message));
}

// Simple eBay price fetch (simulate with public API or scrape if allowed)
function fetchEbayPrice(searchTerm, cardId) {
  // This is a placeholder example. Real scraping or API is more complex.
  // Here we fake the price with a timeout and random number for demo.
  setTimeout(() => {
    document.getElementById(`ebay-price-${cardId}`).innerText = `$${(Math.random() * 100).toFixed(2)}`;
  }, 1000);
}

// Simple Goldin price fetch (simulate)
// Real API needs key and backend proxy for CORS, so this is a placeholder
function fetchGoldinPrice(searchTerm, cardId) {
  setTimeout(() => {
    document.getElementById(`goldin-price-${cardId}`).innerText = `$${(Math.random() * 150).toFixed(2)}`;
  }, 1200);
}

function filterCards() {
  const filterText = document.getElementById("searchFilter").value.toLowerCase();
  const filtered = allCards.filter(card =>
    card.cardName.toLowerCase().includes(filterText) ||
    card.folder.toLowerCase().includes(filterText) ||
    card.cardType.toLowerCase().includes(filterText)
  );
  renderCards(filtered);
}

function scanCard() {
  const file = document.getElementById("cardImage").files[0];
  if (!file) return alert("Upload an image first.");

  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById("preview").src = e.target.result;
    document.getElementById("preview").style.display = "block";

    Tesseract.recognize(e.target.result, 'eng').then(({ data: { text } }) => {
      const lines = text.split("\n").filter(Boolean);
      if (lines.length > 0) {
        document.getElementById("cardName").value = lines[0];
        document.getElementById("ebaySearch").value = lines[0];
      }
    });
  };
  reader.readAsDataURL(file);
}
