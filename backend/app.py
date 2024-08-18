from flask import Flask, jsonify, request
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy import text
from flask_cors import CORS
from src.llm import PurpleGPT, remove_alias_from_sql
import openai
import os

# Initialize the Flask app
app = Flask(__name__)
CORS(app)

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
database_url = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
openai.api_key = OPENAI_API_KEY
db = SQLAlchemy(app)

# Load the model and tokenizer
model_name = "defog/llama-3-sqlcoder-8b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    trust_remote_code=True,
    torch_dtype=torch.float16,
    device_map="cuda:0",
    use_cache=True,
)
purplegpt = PurpleGPT(model, tokenizer)

# Employee model
class Employee(db.Model):
    __tablename__ = 'employee'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=False)
    gender = db.Column(db.String(50))
    role = db.Column(db.String(50))
    profile_pic = db.Column(db.Text)
    working_hours = db.Column(db.Integer)
    company = db.Column(db.String(100))
    base_salary = db.Column(db.Integer)
    progress = db.Column(db.Integer)

    def __repr__(self):
        return f'<Employee {self.first_name} {self.last_name}>'


class Attendance(db.Model):
    __tablename__ = 'absensi_harian'

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'))
    date = db.Column(db.Date)
    month = db.Column(db.Integer)
    year = db.Column(db.Integer)
    status = db.Column(db.String(50))
    overtime_hours = db.Column(db.Float)
    work_hours = db.Column(db.Float)

    employee = db.relationship('Employee', backref=db.backref('absensi_harian', lazy=True))

    def __repr__(self):
        return f'<Attendance {self.date} - {self.status}>'


# Route to get all employees
@app.route('/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    result = []
    for employee in employees:
        employee_data = {
            'id': employee.id,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'email': employee.email,
            'gender': employee.gender,
            'role': employee.role,
            'profile_pic': employee.profile_pic,
            'working_hours': employee.working_hours,
            'company': employee.company,
            'base_salary': employee.base_salary,
            'progress': employee.progress
        }
        result.append(employee_data)
    return jsonify(result)


@app.route('/attendance', methods=['GET'])
def get_employee_attendance():
    try:
        # Get month and year from query parameters
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        day = request.args.get('day', type=int)

        # Query employees and their attendance records for the specified month and year
        employees_attendance = db.session.query(Employee, Attendance)\
            .filter(Employee.id == Attendance.employee_id)\
            .filter(Attendance.month == month, Attendance.year == year, func.extract('day', Attendance.date) == day)\
            .all()

        result = []
        for employee, attendance in employees_attendance:
            employee_data = {
                'id': employee.id,
                'first_name': employee.first_name,
                'last_name': employee.last_name,
                'attendance_date': attendance.date,
                'attendance_status': attendance.status,
                'overtime_hours': attendance.overtime_hours,
                'work_hours': attendance.work_hours,
                'company': employee.company,
                'profile_pic': employee.profile_pic
            }
            result.append(employee_data)

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/employee-ai/edit', methods=['POST'])
def employee_ai():
    ## LLAMA Block
    user_input = request.json.get('content')
    if not user_input:
        return jsonify({'error': 'Content is required'}), 400
    try:
        response = purplegpt.generate_sql(user_input)
        
        generated_sql = response["response"]
        is_update = response["is_update"]
        generated_sql = remove_alias_from_sql(generated_sql)
        print(generated_sql, is_update) # For debugging
        if not generated_sql:
            return jsonify({'error': 'No SQL statement generated'}), 500
        
        db.session.execute(text(generated_sql))  # Use text() to declare the SQL query
        db.session.commit()
        return jsonify({'message': 'Query executed successfully', 'status': 200}), 200

    except Exception as e:
        return jsonify({'error': str(e), 'status': 500}), 500


# Run the Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
