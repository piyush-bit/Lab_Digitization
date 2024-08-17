Here are the SQL commands to create the tables for your PostgreSQL database schema:

### 1. **Students Table**
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    enrollment_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL
);
```

### 2. **Programs Table**
```sql
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    program_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **Instructors Table**
```sql
CREATE TABLE instructors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255) NOT NULL
);
```

### 4. **Lab Sessions Table**
```sql
CREATE TABLE lab_sessions (
    id SERIAL PRIMARY KEY,
    program_id INTEGER REFERENCES programs(id),
    instructor_id INTEGER REFERENCES instructors(id),
    session_date DATE NOT NULL,
    description TEXT
);
```

### 5. **Questions Table**
```sql
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    lab_session_id INTEGER REFERENCES lab_sessions(id),
    description TEXT NOT NULL,
    inputs_outputs TEXT NOT NULL
);
```

### 6. **Submissions Table**
```sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    question_id INTEGER REFERENCES questions(id),
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    result_details TEXT
);
```

### 7. **Lab Attendance Table**
```sql
CREATE TABLE lab_attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    program_id INTEGER REFERENCES programs(id),
    lab_session_id INTEGER REFERENCES lab_sessions(id),
    attendance_status VARCHAR(50) NOT NULL,
    completed_questions_count INTEGER DEFAULT 0
);
```

These commands will create tables with appropriate relationships and constraints for your PostgreSQL database. Adjust the data types and constraints as needed based on your specific requirements.