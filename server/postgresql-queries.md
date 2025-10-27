# PostgreSQL Commands to View Students Table

## Connect to PostgreSQL (using psql)
```bash
# Using connection string from your .env file
psql "your_database_connection_string_here"

# Or using individual parameters
psql -h localhost -p 5432 -U your_username -d your_database_name
```

## Useful SQL Queries for Students Table

### 1. View all students (basic info)
```sql
SELECT id, name, email, university, field, gpa, "needUSD", sponsored, "studentPhase" 
FROM "Student" 
ORDER BY "createdAt" DESC;
```

### 2. View students with applications
```sql
SELECT 
    s.name,
    s.email,
    s.university,
    s.gpa,
    s."needUSD",
    s.sponsored,
    s."studentPhase",
    a.status as application_status,
    a.amount as application_amount
FROM "Student" s
LEFT JOIN "Application" a ON s.id = a."studentId"
ORDER BY s."createdAt" DESC;
```

### 3. Students summary statistics
```sql
SELECT 
    COUNT(*) as total_students,
    COUNT(*) FILTER (WHERE sponsored = true) as sponsored_count,
    COUNT(*) FILTER (WHERE sponsored = false) as unsponsored_count,
    AVG(gpa) as average_gpa,
    SUM("needUSD") as total_funding_need
FROM "Student";
```

### 4. Students by phase
```sql
SELECT 
    "studentPhase",
    COUNT(*) as count
FROM "Student"
GROUP BY "studentPhase";
```

### 5. Students by university
```sql
SELECT 
    university,
    COUNT(*) as student_count,
    AVG(gpa) as avg_gpa
FROM "Student"
GROUP BY university
ORDER BY student_count DESC;
```

### 6. Full student details with related data
```sql
SELECT 
    s.name,
    s.email,
    s.university,
    s.field,
    s.program,
    s.gpa,
    s."gradYear",
    s.city,
    s.country,
    s."needUSD",
    s.sponsored,
    s."studentPhase",
    COUNT(DISTINCT a.id) as application_count,
    COUNT(DISTINCT m.id) as message_count,
    COUNT(DISTINCT d.id) as document_count,
    s."createdAt"
FROM "Student" s
LEFT JOIN "Application" a ON s.id = a."studentId"
LEFT JOIN "Message" m ON s.id = m."studentId"
LEFT JOIN "Document" d ON s.id = d."studentId"
GROUP BY s.id
ORDER BY s."createdAt" DESC;
```