

// -----------------------------
// Resume Upload Handler
// -----------------------------
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Analyzing...';
    submitBtn.disabled = true;

    const formData = new FormData(this);

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById("results").innerHTML = `
                <div class="card error-card">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                    <p>${data.error}</p>
                </div>
            `;
            return;
        }

        document.getElementById("results").innerHTML = `
            <div class="card">
                <h2><i class="fas fa-chart-line"></i> ATS Score</h2>
                <div class="ats-score">${data.ats_score}/100</div>
            </div>

            <div class="card">
                <h2><i class="fas fa-lightbulb"></i> Improvement Suggestions</h2>
                <div class="suggestions">
                    <ul>
                        ${data.suggestions.map(s => `<li><i class="fas fa-check-circle"></i> ${s}</li>`).join("")}
                    </ul>
                </div>
            </div>

            <div class="card">
                <h2><i class="fas fa-envelope"></i> AI Generated Cover Letter</h2>
                <pre>${data.cover_letter}</pre>
            </div>

            <div class="card">
                <h2><i class="fas fa-question-circle"></i> Interview Questions</h2>
                <pre>${data.questions}</pre>
            </div>
        `;

        // Smooth scroll to results
        document.getElementById("results").scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        document.getElementById("results").innerHTML = `
            <div class="card error-card">
                <h2><i class="fas fa-exclamation-triangle"></i> Network Error</h2>
                <p>Unable to connect to the server. Please try again.</p>
            </div>
        `;
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});


// -----------------------------
// Voice Recognition (Interview)
// -----------------------------
function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Your browser does not support voice recognition. Please use a modern browser like Chrome or Edge.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    const voiceBtn = document.querySelector('.voice-controls button:first-child');
    const originalText = voiceBtn.innerHTML;
    voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i> Listening...';
    voiceBtn.disabled = true;

    recognition.onstart = function () {
        console.log("Voice recognition started...");
        document.getElementById("answerText").placeholder = "Listening... Speak now!";
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("answerText").value = transcript;
        document.getElementById("answerText").placeholder = "Speak or write your answer here...";
    };

    recognition.onend = function () {
        voiceBtn.innerHTML = originalText;
        voiceBtn.disabled = false;
        document.getElementById("answerText").placeholder = "Speak or write your answer here...";
    };

    recognition.onerror = function (event) {
        console.error("Voice error:", event.error);
        voiceBtn.innerHTML = originalText;
        voiceBtn.disabled = false;
        document.getElementById("answerText").placeholder = "Speak or write your answer here...";

        let errorMessage = "Voice recognition failed. ";
        switch(event.error) {
            case 'no-speech':
                errorMessage += "No speech was detected.";
                break;
            case 'audio-capture':
                errorMessage += "Audio capture failed.";
                break;
            case 'not-allowed':
                errorMessage += "Microphone access denied.";
                break;
            default:
                errorMessage += "Please try again.";
        }
        alert(errorMessage);
    };

    recognition.start();
}


// -----------------------------
// Send Answer for AI Feedback
// -----------------------------
async function submitAnswer() {
    const answer = document.getElementById("answerText").value;

    if (!answer.trim()) {
        alert("Please enter or record an answer first!");
        return;
    }

    const submitBtn = document.querySelector('.voice-controls button:last-child');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading"></span> Analyzing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch("/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ answer })
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById("feedbackResult").innerHTML = `
                <div class="card error-card">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error</h2>
                    <p>${data.error}</p>
                </div>
            `;
            return;
        }

        document.getElementById("feedbackResult").innerHTML = `
            <div class="card">
                <h2><i class="fas fa-brain"></i> AI Feedback</h2>
                <pre>${data.feedback}</pre>
            </div>
        `;

    } catch (error) {
        document.getElementById("feedbackResult").innerHTML = `
            <div class="card error-card">
                <h2><i class="fas fa-exclamation-triangle"></i> Network Error</h2>
                <p>Unable to get feedback. Please try again.</p>
            </div>
        `;
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}