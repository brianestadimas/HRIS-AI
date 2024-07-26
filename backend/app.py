from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy import create_engine
from openai import OpenAI
from sqlalchemy import text
from flask_cors import CORS
import openai
import os
from llama_index.llms.openai import OpenAI
from llama_index.core import SQLDatabase
from llama_index.core import VectorStoreIndex
from llama_index.core.objects import ObjectIndex, SQLTableNodeMapping, SQLTableSchema
from llama_index.core.indices.struct_store.sql_query import SQLTableRetrieverQueryEngine

app = Flask(__name__)
CORS(app)

OPENAI_API_KEY = ""


# PostgreSQL connection configuration
# Replace 'postgres://username:password@localhost:5432/hris' with your actual connection string
database_url = 'postgresql://postgres:password@localhost:5432/hris'
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
openai.api_key = OPENAI_API_KEY
db = SQLAlchemy(app)

''' LLAMA INDEX '''
# Table Context
tables_context = [
    {
        "table_name": "employee",
        "context": "List of employee in the app, contains first_name, last_name, email, gender, role, company, working_hours (weekly), and progress.",
    },
    {
        "table_name": "absensi_harian",
        "context": "Records daily attendance information for employees, capturing absence statuses. Contains employee_id, date, month, year, status (mean ontime or tardiness), overtime_hours, work_hours per day.",
    },
]

engine = create_engine(database_url)
# llm = OpenAI(api_key=OPENAI_API_KEY, model="ft:gpt-3.5-turbo-0125:personal:evaluationai:9mDX4VhX")
llm = OpenAI(api_key=OPENAI_API_KEY, model="gpt-4o")

sql_database = SQLDatabase(
    engine, include_tables=[table["table_name"] for table in tables_context]
)
tables = list(sql_database._all_tables)
table_node_mapping = SQLTableNodeMapping(sql_database)
table_schema_objs = []
for idx, table in enumerate(tables):
    table_schema_objs.append((SQLTableSchema(table_name = table, context_str = tables_context[idx]["context"])))

tables = list(sql_database._all_tables)
table_node_mapping = SQLTableNodeMapping(sql_database)
table_schema_objs = []
for idx, table in enumerate(tables):
    table_schema_objs.append((SQLTableSchema(table_name = table, context_str = tables_context[idx]["context"])))
    
obj_index = ObjectIndex.from_objects(
    table_schema_objs,
    table_node_mapping,
    VectorStoreIndex
)

# initializing query engine 
query_engine = SQLTableRetrieverQueryEngine(
    sql_database, obj_index.as_retriever(similarity_top_k=3), 
)
''' END OF LLAMA INDEX '''

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



client = OpenAI()
@app.route('/employee-ai/edit', methods=['POST'])
def employee_ai():
    user_input = request.json.get('content')  # Get input from request body
    if not user_input:
        return jsonify({'error': 'Content is required'}), 400

    try:
        completion = client.chat.completions.create(
            model="ft:gpt-3.5-turbo-0125:personal::9luaAwx2",
            messages=[
                {"role": "system", "content": "You are an assistant to output SQL queries for INSERT or UPDATE statements only."},
                {"role": "user", "content": user_input + " no need any constraints"},
            ]
        )

        sql_query = completion.choices[0].message.content  # Correct access to message content
        print(sql_query)  # For debugging

        # Execute the SQL query
        db.session.execute(text(sql_query))  # Use text() to declare the SQL query
        db.session.commit()

        return jsonify({'message': 'Query executed successfully', 'status': 200}), 200

    except Exception as e:
        return jsonify({'error': str(e), 'status': 500}), 500


@app.route('/evaluation-ai/', methods=['POST'])
def evaluation_ai():
    user_input = request.json.get('content')  # Get input from request body
    if not user_input:
        return jsonify({'error': 'Content is required'}), 400
    try:
        format = "{employee:[], answer: YOUR_ANSWER_HERE}"
        template = f"You are an assistant to provide information and evaluations based on the employee and absensi_harian tables. Provide output in format {format}, leave empty if no employee related. \nINPUT: {user_input}"
        response = query_engine.query(user_input + " jelaskan lebih lanjut (jangan gunakan user id) dan berikan saran")

        # if not isinstance(response, str):
        #     response = str(response)
        
        # # Manually parse the response string
        # print(response)
        # response = response.strip('{}')
        # response_parts = response.split(', answer:')
        # employee_part = response_parts[0].split(':')[1]
        # answer_part = response_parts[1]

        # # Construct the dictionary
        # response_dict = {
        #     "employee": employee_part,
        #     "answer": answer_part3
        # }
        
        
        # print(response_dict)  # For debugging
        # sql_query = completion.choices[0].message.content  # Correct access to message content
        return jsonify({'message': str(response), 'status': 200}), 200
    
    except Exception as e:
        return jsonify({'error': str(e), 'status': 500}), 500


if __name__ == '__main__':
    app.run(debug=True)
