import psycopg2

connection_string = "postgresql://postgres.pvyzmcmmcwhfqfhtfibi:bBi3ZmI5rrb3Q2lK@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

try:
    conn = psycopg2.connect(connection_string)
    cur = conn.cursor()
    
    print("=== TESTING SQL JOIN FOR UPLOAD LOGS ===")
    cur.execute("""
        SELECT count(*) 
        FROM presensi.upload_log;
    """)
    print("Total upload logs in db:", cur.fetchone()[0])
    
    cur.execute("""
        SELECT count(*) 
        FROM master.users;
    """)
    print("Total users in master.users:", cur.fetchone()[0])
    
    cur.execute("""
        SELECT u.id, u.file_name_original, u.uploaded_by, usr.username
        FROM presensi.upload_log u
        LEFT JOIN master.users usr ON u.uploaded_by = usr.id
        LIMIT 5;
    """)
    print("Left Join Samples:")
    for row in cur.fetchall():
        print(f"  Log ID: {row[0]}, File: {row[1]}, Uploaded By: {row[2]}, Username: {row[3]}")
        
    cur.execute("""
        SELECT u.id, u.file_name_original, u.uploaded_by, usr.username
        FROM presensi.upload_log u
        INNER JOIN master.users usr ON u.uploaded_by = usr.id
        LIMIT 5;
    """)
    print("Inner Join Samples:")
    for row in cur.fetchall():
        print(f"  Log ID: {row[0]}, File: {row[1]}, Uploaded By: {row[2]}, Username: {row[3]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
