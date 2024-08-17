import { Pool } from 'pg';

//connect using postgress url 

export const pool = new Pool({
    connectionString: "postgresql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable"
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    process.exit(-1)
})

pool.on('connect', (client) => {
    console.log('Database connected')
})

pool.on('remove', (client) => {
    console.log('Database connection removed')
})

pool.connect()