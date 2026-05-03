from flask import Flask, render_template, request, jsonify
import os
import PyPDF2
from groq import Groq
from dotenv import load_dotenv


load_dotenv()

API_KEY = os.getenv("GROQ_API_KEY")

if not API_KEY:
    raise ValueError(" GROQ_API_KEY not found in .env file")


client = Groq(api_key=API_KEY)

MODEL_NAME = "llama-3.1-8b-instant" # fast + free tier friendly


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


def extract_resume_text(filepath):
    text = ""
    try:
        with open(filepath, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                content = page.extract_text()
                if content:
                    text += content + "\n"
        return text.strip()
    except Exception as e:
        print("PDF Error:", e)
        return ""

# -----------------------------
# ATS Score (same logic)
# -----------------------------
def analyze_resume(text):
    score = min(len(text) // 50, 100)
    suggestions = [
        "Add measurable achievements",
        "Use strong action verbs",
        "Include ATS keywords",
        "Add technical skills section",
        "Keep resume concise"
    ]
    return score, suggestions

# -----------------------------
# GROQ CHAT FUNCTION
# -----------------------------
def groq_chat(prompt):
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"

# -----------------------------
# Cover Letter
# -----------------------------
def generate_cover_letter(text):
    prompt = f"""
Write a professional cover letter based on this resume:

{text[:2000]}
"""
    return groq_chat(prompt)

# -----------------------------
# Interview Questions
# -----------------------------
def generate_questions(text):
    prompt = f"""
Generate 5 interview questions:
- 3 technical
- 2 behavioral

Based on this resume:

{text[:1500]}
"""
    return groq_chat(prompt)

# -----------------------------
# Answer Feedback
# -----------------------------
def evaluate_answer(answer):
    prompt = f"""
Evaluate this interview answer:

{answer}

Give feedback on:
- Clarity
- Confidence
- Improvements
"""
    return groq_chat(prompt)

# -----------------------------
# ROUTES
# -----------------------------
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/upload', methods=['POST'])
def upload_resume():
    try:
        file = request.files.get('resume')

        if not file or file.filename == '':
            return jsonify({"error": "No file uploaded"})

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        resume_text = extract_resume_text(filepath)

        if not resume_text:
            return jsonify({"error": "Could not read PDF"})

        score, suggestions = analyze_resume(resume_text)
        cover = generate_cover_letter(resume_text)
        questions = generate_questions(resume_text)

        return jsonify({
            "ats_score": score,
            "suggestions": suggestions,
            "cover_letter": cover,
            "questions": questions
        })

    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/feedback', methods=['POST'])
def feedback():
    try:
        data = request.get_json()
        answer = data.get("answer", "")

        if not answer.strip():
            return jsonify({"error": "Empty answer"})

        result = evaluate_answer(answer)

        return jsonify({"feedback": result})

    except Exception as e:
        return jsonify({"error": str(e)})

# -----------------------------
# RUN
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)