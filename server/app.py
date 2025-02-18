import firebase_admin
from firebase_admin import firestore, credentials, auth
from flask_cors import CORS
from flask import Flask, request, jsonify
import tempfile
import subprocess

# Set up firestore database
cred = credentials.Certificate('key.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Create the Flask app
app = Flask(__name__)
CORS(app)


# api route to handle registering
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        user_id = data["user_id"]
        email = data["email"]
        name = data["name"]
        role = data["role"]

        # Save user data in Firestore
        user_ref = db.collection("users").document(user_id)
        user_ref.set({
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": role,
        })

        return jsonify({"message": "User registered successfully", "uid": user_id, "email": email, "name": name,
                        "role": role}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# API route to handle user role checking
@app.route("/check-role", methods=["POST"])
def check_role():
    try:
        # Get the Firebase ID token from the request
        id_token = request.json.get("idToken")
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

        # Fetch user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        if user_doc.exists:
            user_data = user_doc.to_dict()
            return jsonify({"role": user_data.get("role")})
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 401


# API route to send the code to from student ide to the server
@app.route('/run', methods=['POST'])
def run_code():
    user_code = request.json.get("code", "")

    TEMPLATE = """
        #include <iostream>
        using namespace std;

        class serial {
            public:
                static void println(const string& msg) { cout << msg; }
                static void println(int num) { cout << num; }
                static void begin(int rate) { int baudRate = rate; }  // Simulated baud rate setup
        };

        void setup();
        void loop();

        serial Serial;  // Global serial object

        int main() {
            setup();
            for (int i = 0; i < 1; i++) loop();  // Simulate running loop()
            return 0;
        }

        {}

    """

    complete_code = TEMPLATE.replace("{}", user_code)  # Safe replacement

    with tempfile.NamedTemporaryFile(suffix=".cpp", delete=False) as temp:
        temp.write(complete_code.encode())
        temp.close()

        try:
            output = subprocess.check_output(
                ["g++", temp.name, "-o", "arduino_sim"]
            )
            result = subprocess.check_output(["./arduino_sim"]).decode()
            return jsonify({"output": result})
        except subprocess.CalledProcessError as e:
            return jsonify({"error": e.output.decode()})


# Run the Flask server
app.run(debug=True, port=8080)
