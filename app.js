// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1_f5mkPPdPF0bZcJQT69gWX8KdAHR4c8",
  authDomain: "cardboard-mania.firebaseapp.com",
  projectId: "cardboard-mania",
  storageBucket: "cardboard-mania.appspot.com",
  messagingSenderId: "940513136308",
  appId: "1:940513136308:web:51ea71edd7a13d8f9ad1e1",
  measurementId: "G-SQP6ZRYM3W"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password).catch(alert);
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password).catch(alert);
}

auth.onAuthStateChanged(user => {
  if (user) {
    loadCards(user.uid);
  }
});

document.getElementById("cardImage").addEventListener("change", function () {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("preview").src = e.target.result;
      document.getElementById("preview").style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

function addCard() {
  const user = auth.currentUser;
  if (!user) return alert("Please log in");

  const folder = document.getElementById("folder").value;
  const cardName = document.getElementById("cardName").value;
  const cardType = document.getElementById("cardType").value;
  const condition = document.getElementById("condition").value;
  const purchasePrice = parseFloat(document.getElementById("purchasePrice").value);
  const ebaySearch = document.getElementById("ebaySearch").value;
  const imageFile = document.getElementById("cardImage").files[0];

  const cardData = {
    folder,
    cardName,
    cardType,
    condition,
    purchasePrice,
    ebaySearch,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (imageFile) {
    const storageRef = storage.ref(`cards/${user.uid}/${Date.now()}-${imageFile.name}`);
    storageRef.put(imageFile).then(snapshot => {
      snapshot.ref.getDownloadURL().then(url => {
        cardData.imageUrl = url;
        db.collection("users").doc(user.uid).collection("cards").add(cardData).then(() => {
          loadCards(user.uid);
        });
      });
    });
  } else {
    db.collection("users").doc(user.uid).collection("cards").add(cardData).then(() => {
      loadCards(user.uid);
    });
  }
}

function loadCards(uid) {
  db.collection("users").doc(uid).collection("cards").orderBy("createdAt", "desc").onSnapshot(snapshot => {
    const cardList = document.getElementById("cardList");
    cardList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const cardDiv = document.createElement("div");
      cardDiv.className = "card";
      cardDiv.innerHTML = `
        <h3>${data.cardName}</h3>
        <p>Type: ${data.cardType}</p>
        <p>Condition: ${data.condition}</p>
        <p>Price: $${data.purchasePrice || "?"}</p>
        <p>Folder: ${data.folder}</p>
        <a href="https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(data.ebaySearch)}" target="_blank">eBay Prices</a>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Card image" />` : ""}
        <button onclick="deleteCard('${uid}', '${doc.id}')">Delete</button>
      `;
      cardList.appendChild(cardDiv);
    });
  });
}

function deleteCard(uid, cardId) {
  db.collection("users").doc(uid).collection("cards").doc(cardId).delete();
}
