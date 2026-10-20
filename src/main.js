import { onAuthReady } from "/src/authentication.js";
import { db } from "./firebaseConfig.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    onSnapshot
} from "firebase/firestore";

// Display the signed-in user's name.
function showName() {
    onAuthReady(function (user) {
        const nameElement = document.getElementById("name-goes-here");

        if (nameElement && user) {
            nameElement.textContent = user.displayName || user.email || "friend";
        }
    });
}

// Read today's quote from Firestore.
// Supports both lowercase and capitalized document IDs.
async function readQuoteForToday() {
    const quoteElement = document.getElementById("quote-goes-here");
    if (!quoteElement) return;

    const day = new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

    try {
        const lowerRef = doc(db, "quotes", day);
        const lowerSnap = await getDoc(lowerRef);

        const quoteRef = lowerSnap.exists()
            ? lowerRef
            : doc(db, "quotes", day.charAt(0).toUpperCase() + day.slice(1));

        onSnapshot(
            quoteRef,
            (snapshot) => {
                quoteElement.textContent = snapshot.exists()
                    ? snapshot.data().quote
                    : "No quote has been added for today yet.";
            },
            (error) => console.error("Error reading quote:", error)
        );
    } catch (error) {
        console.error("Error loading quote:", error);
        quoteElement.textContent = "Could not load today's quote.";
    }
}

// Add sample hikes only when the hikes collection is empty.
async function seedHikesIfEmpty() {
    const hikesRef = collection(db, "hikes");
    const snapshot = await getDocs(hikesRef);

    if (!snapshot.empty) {
        console.log("Hikes already exist. Skipping seed.");
        return;
    }

    const hikes = [
        {
            code: "BBY01",
            name: "Burnaby Lake Park Trail",
            city: "Burnaby",
            level: "easy",
            details: "A lovely place for a lunch walk.",
            length: 10,
            hike_time: 60,
            lat: 49.2467097082573,
            lng: -122.9187029619698
        },
        {
            code: "AM01",
            name: "Buntzen Lake Trail",
            city: "Anmore",
            level: "moderate",
            details: "Close to town, and relaxing.",
            length: 10.5,
            hike_time: 80,
            lat: 49.3399431028579,
            lng: -122.85908496766939
        },
        {
            code: "NV01",
            name: "Mount Seymour Trail",
            city: "North Vancouver",
            level: "hard",
            details: "Amazing ski slope views.",
            length: 8.2,
            hike_time: 120,
            lat: 49.38847101455571,
            lng: -122.94092543551031
        }
    ];

    await Promise.all(
        hikes.map((hike) =>
            addDoc(hikesRef, {
                ...hike,
                last_updated: serverTimestamp()
            })
        )
    );

    console.log("Sample hikes added successfully.");
}

// Fetch hikes and display a card for each document.
async function displayCardsDynamically() {
    const template = document.getElementById("hikeCardTemplate");
    const container = document.getElementById("hikes-go-here");

    if (!template || !container) {
        console.error("Hike card template or container is missing.");
        return;
    }

    container.replaceChildren();

    try {
        const snapshot = await getDocs(collection(db, "hikes"));

        snapshot.forEach((hikeDoc) => {
            const hike = hikeDoc.data();
            const card = template.content.cloneNode(true);

            card.querySelector(".card-title").textContent = hike.name;
            card.querySelector(".card-text").textContent =
                hike.details || `Located in ${hike.city}.`;
            card.querySelector(".card-length").textContent = hike.length;

            const image = card.querySelector(".card-image");
            image.src = `/images/${hike.code}.jpg`;
            image.alt = `${hike.name} image`;

            card.querySelector(".read-more").href =
                `eachHike.html?docID=${encodeURIComponent(hikeDoc.id)}`;

            container.appendChild(card);
        });
    } catch (error) {
        console.error("Error displaying hikes:", error);
    }
}

// Run the page features.
async function startMainPage() {
    showName();
    readQuoteForToday();

    try {
        await seedHikesIfEmpty();
    } catch (error) {
        console.error("Error seeding hikes:", error);
    }

    await displayCardsDynamically();
}

startMainPage();