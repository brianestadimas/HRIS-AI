ddl_statement = """CREATE TABLE employee (
    id INTEGER NOT NULL, --Unique ID for each employee
    first_name VARCHAR(50), --First name of employee
    last_name VARCHAR(50), --Last name of employee, can be null
    email VARCHAR(50), --Email of employee, can not be duplicated
    gender VARCHAR(50), --Gender of employee, Male or Female
    role VARCHAR(50), --Role of employee in the company like internship, manager-likely, etc. lowercase
    profile_pic text, --Always leave this empty for now
    working_hours INTEGER, --Weekly working hours depend on role as well and base_salary
    company VARCHAR(100) DEFAULT 'Sakura SSS'::VARCHAR, --Company or subgroup of employee
    base_salary INTEGER, --Base salary of employee, also depend on the role
    progress INTEGER, --Current week progress, depends on the working_hours relative to absensi_harian work_hours and overtime
);


CREATE TABLE absensi_harian (
    id INTEGER NOT NULL, --Unique ID
    employee_id INTEGER, --ID of employee
    date date, --date of attendance
    month INTEGER, --month of attendance
    year INTEGER, --year of attendance
    status VARCHAR(20), --status can be 'ontime', 'izin', 'sakit', 'terlambat', 'sangat terlambat', best to worse, affect performance, employee.progress and work_hours
    overtime_hours DECIMAL(10,2), --overtime_hours, the more the better performance and progress, however it is limited to 2 hours, and if too much it is also not good for employee balance
    work_hours DECIMAL(10,2), --work_hours per day, it is affected by absensi_harian.status, it should also fulfill the weekly employee.working_hours if calculated
);"""

generate_sql_prompt = """<|begin_of_text|><|start_header_id|>user<|end_header_id|>

Generate an INSERT/UPDATE/DELETE SQL query ONLY to fulfill this user command: `{user_question}`
You will set up the most suitable INSERT/UPDATE/DELETE SQL statements to answer questions related to the data. These SQL statements will later be executed, so they should be error-free, compatible with PostgreSQL syntax, and accurately respond to the questions asked. Do not express an opinion or try to explain. Return only the SQL statement. Remember your sql statement will run on PostgreSQL so syntax should be correct. Only return SQL statement.
Please leave the remaining columns as null ('') if the information about employee is not provided and do not make new assumption (except if default value is provided).
You are a data analyst and interpreter. You will be given information in english or indonesian about a specific dataset, including its tables and their meanings:
employee: List of employee in the app, contains first_name, last_name, email, gender, role, company, working_hours (weekly), and progress.
absensi_harian: Records daily attendance information for employees, capturing absence statuses. Contains employee_id, date, month, year, status (mean ontime or tardiness), overtime_hours, work_hours per day.

Never insert into id column or update it, it is autoincremented.
For Edit/Update, you can use the WHERE clause to specify the row to be updated, it is also possible to update multiple rows at once.
For Edit/Update, user can ask to "add" or "minus" / "tambahkan" or "kurangkan" the value of the column, means you have to increase/decrease specific value using UPDATE statements.
Please leave the remaining columns as null ('') if the information about employee is not provided and do not make new assumption (except if default value is provided).
It is possible to INSERT or UPDATE multiple information or employees at the same time.
If you need to use a specific column, you can refer to it as table_name.column_name.
For anything related best employee performance related, consider to use the most "ontime" first, then "izin", "sakit", "terlambat", "sangat terlambat" as the worst status for employee.progress and work_hours. If there is same status count, then consider the overtime_hours and work_hours must perfectly fit.
For anything related worst employee performance related, consider the most "sangat terlambat" and "terlambat". Also consider the less overtime_hours to overcome the weekly working_hours and work_hours must perfectly fit.
If you cannot fulfill the command with the available database schema or irrelevant command, return 'Mohon maaf, permintaan anda tidak dapat di proses'.

DDL statements:
{ddl_statement}

The following SQL query best to fulfill this user command `{user_question}`:
```sql"""


generate_sql_update_prompt = """<|begin_of_text|><|start_header_id|>user<|end_header_id|>
Remove the alias e here (UPDATE employee e -> UPDATE employee)
Remove the alias e here (UPDATE employee e -> UPDATE employee) and directly use column name: `{user_question}`
Please remove all e. alias or a. alias and directly use column name if there is no FROM and use SET and make sure the SQL is correct and can be run on PostgreSQL.
Please remove all alias and directly use column name if there is no FROM and use SET and make sure the SQL is correct and can be run on PostgreSQL. 
Remove the alias e here (UPDATE employee e -> UPDATE employee) 
Please remove all alias such as UPDATE employee e SHOULD BE UPDATE employee ONLY.
If there is where statement, please use LOWER() function in both column and value.
Also please use ilike in where statement.

DDL statements:
{ddl_statement}

The following SQL query best answers the question `{user_question}`:
```sql"""