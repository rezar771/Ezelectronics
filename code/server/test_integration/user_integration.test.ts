import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import exp from "constants"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const customer2 = { username: "customer2", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const admin2 = { username: "admin2", name: "admin", surname: "admin", password: "admin", role: "Admin" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post('/ezelectronics/users')
        .send(userInfo)
        .expect(200)
}
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                console.log(res.header["set-cookie"])
                resolve(res.header["set-cookie"][0])
            })

    })
}
beforeAll(async () => {
    //cleanup()
    await postUser(admin)
    adminCookie = await login(admin)
})

//After executing tests, we remove everything from our test database
afterAll(() => {
    cleanup()
})

 describe("User routes integration tests", () => {
    describe("POST /users", () => {
        //A 'test' block is a single test. It should be a single logical unit of testing for a specific functionality and use case (e.g. correct behavior, error handling, authentication checks)
        test("It should return a 200 success code and create a new user", async () => {
            await request(app)
                .post("/ezelectronics/users") //The route path is specified here. Other operation types can be defined with similar blocks (e.g. 'get', 'patch', 'delete'). Route and query parameters can be added to the path
                .send(customer) //In case of a POST request, the data is sent in the body of the request. It is specified with the 'send' block. The data sent should be consistent with the API specifications in terms of names and types
                .expect(200) //The 'expect' block is used to check the response status code. We expect a 200 status code for a successful operation
                const users = await request(app) //It is possible to assign the response to a variable and use it later. 
                .get("/ezelectronics/users")
                .set("Cookie", adminCookie) //Authentication is specified with the 'set' block. Adding a cookie to the request will allow authentication (if the cookie has been created with the correct login route). Without this cookie, the request will be unauthorized
                .expect(200)
            expect(users.body).toHaveLength(2) //Since we know that the database was empty at the beginning of our tests and we created two users (an Admin before starting and a Customer in this test), the array should contain only two users
            let cust = users.body.find((user: any) => user.username === customer.username) //We look for the user we created in the array of users
            expect(cust).toBeDefined() //We expect the user we have created to exist in the array. The parameter should also be equal to those we have sent
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send({ username: "", name: "test", surname: "test", password: "test", role: "Customer" }) //We send a request with an empty username. The express-validator checks will catch this and return a 422 error code
                .expect(422)
            await request(app).post(`${routePath}/users`).send({ username: "test", name: "", surname: "test", password: "test", role: "Customer" }).expect(422) //We can repeat the call for the remaining body parameters
        })
        test("It should return a 409 error code if the username already exists", async () => {
            await request(app)
                .post(`${routePath}/users`)
                .send({ username: customer.username, name: "test", surname: "test", password: "test", role: "Customer" }) 
                .expect(409)
        })
    })
    describe("GET /users", () => {
        test("It should return an array of users", async () => {
            const users = await request(app).get(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            expect(users.body).toHaveLength(2)
            let cust = users.body.find((user: any) => user.username === customer.username)
            expect(cust).toBeDefined()
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            let adm = users.body.find((user: any) => user.username === admin.username)
            expect(adm).toBeDefined()
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
            expect(adm.role).toBe(admin.role)
        })

        test("It should return a 401 error code if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users`).set("Cookie", customerCookie).expect(401) //We call the same route but with the customer cookie. The 'expect' block must be changed to validate the error
            await request(app).get(`${routePath}/users`).expect(401) //We can also call the route without any cookie. The result should be the same
        })
    })
    describe("GET /users/roles/:role", () => {
        test("It should return an array of users with a specific role", async () => {
            //Route parameters are set in this way by placing directly the value in the path
            //It is not possible to send an empty value for the role (/users/roles/ will not be recognized as an existing route, it will return 404)
            //Empty route parameters cannot be tested in this way, but there should be a validation block for them in the route
            const admins = await request(app).get(`${routePath}/users/roles/Admin`).set("Cookie", adminCookie).expect(200)
            expect(admins.body).toHaveLength(1) //In this case, we expect only one Admin user to be returned
            let adm = admins.body[0]
            expect(adm.username).toBe(admin.username)
            expect(adm.name).toBe(admin.name)
            expect(adm.surname).toBe(admin.surname)
        })

        test("It should fail if the role is not valid", async () => {
            //Invalid route parameters can be sent and tested in this way. The 'expect' block should contain the corresponding code
            await request(app).get(`${routePath}/users/roles/Invalid`).set("Cookie", adminCookie).expect(422)
        })
        test("It should fail if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users/roles/Customer`).set("Cookie", customerCookie).expect(401)
            await request(app).get(`${routePath}/users/roles/Customer`).expect(401)
        })
    })
    describe("GET `ezelectronics/users/:username", () => {
        test("It should return a single user with a specific username", async () => {
            const user = await request(app).get(`${routePath}/users/customer`).set("Cookie", adminCookie).expect(200)
            let cust = user.body;
            expect(cust.username).toBe(customer.username)
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
        })
        test("It should fail if the username is not valid", async () => {
            await request(app).get(`${routePath}/users/Inavlid`).set("Cookie", adminCookie).expect(404)
        })
        test("It should fail if the user is not an Admin", async () => {
            customerCookie = await login(customer)
            await request(app).get(`${routePath}/users/admin`).set("Cookie", customerCookie).expect(401)
            await request(app).get(`${routePath}/users/admin`).expect(401)
        })
    })
    describe("DELETE ezelectronics/users/:username", () => {
        test("It should delete a specific user, identified by the username", async () => {
            await request(app).delete(`${routePath}/users/customer`).set("Cookie", adminCookie).expect(200)
            const users = await request(app) //I check if the customer was correctly deleted 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
            let cust = users.body.find((user: any) => user.username === customer.username) 
            expect(cust).toBeUndefined() 
            await postUser(customer)
        })
        test("It should delete the caller of the API if the username corresponds", async () => {
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/users/customer`).set("Cookie", customerCookie).expect(200)
            const users = await request(app) //I check if the customer was correctly deleted 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
            let cust = users.body.find((user: any) => user.username === customer.username) 
            expect(cust).toBeUndefined() 
            await postUser(customer)
        })
        test("It should return a 404 error code if the username is invalid", async () => {
            await request(app).delete(`${routePath}/users/invalid`).set("Cookie", adminCookie).expect(404)
        })
        test("It should return a 401 error code if the username is not an admin and tries to delete an other user", async () => {
            await postUser(customer2)
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/users/customer2`).set("Cookie", customerCookie).expect(401)
        })
        test("It should return a 401 error code if the username is an admin and tries to delete an other admin", async () => {
            await postUser(admin2)
            await request(app).delete(`${routePath}/users/admin2`).set("Cookie", adminCookie).expect(401)
        })
    })
    describe("PATCH ezelectronics/users/:username", () => {
        test("It should update the info of the caller user, identified by the username", async () => {
            customerCookie = await login(customer)
            const updatedUser = await request(app).patch(`${routePath}/users/customer`).set("Cookie", customerCookie).
            send({name: "test_update", surname: customer.surname, address : "test", birthdate : "2001-01-01" }).
            expect(200)
            let cust = updatedUser.body
            expect(cust.username).toBe(customer.username)
            expect(cust.name).toBe("test_update")
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
            expect(cust.address).toBe("test")
            expect(cust.birthdate).toBe("2001-01-01")

        })
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).
            send({ name: "", surname: "", address : "test", birthdate : "2001-01-01" }).
            expect(422)
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).
            send({ surname: "test", address : "test", birthdate : "2001-01-01" }).
            expect(422)
            await request(app).patch(`${routePath}/users/customer`).set("Cookie", adminCookie).
            send({ name : "test", surname: "test", address : "test", birthdate : "01-01-2001" }).
            expect(422)
        })
        test("It should return a 401 error code if the username is not an admin and tries to update an other user", async () => {
            customerCookie = await login(customer)
            await request(app).patch(`${routePath}/users/customer2`).set("Cookie", customerCookie).
            send({ name: "test_update", surname: customer2.surname, address : "test", birthdate : "2001-01-01" }).
            expect(401)
        })
        test("It should return a 401 error code if the username is an admin and tries to delete an other admin", async () => {
            await request(app).patch(`${routePath}/users/admin2`).set("Cookie", adminCookie).
            send({ name: "test_update", surname: admin2.surname, address : "test", birthdate : "2001-01-01" }).
            expect(401)
        })
        test("It should return a 400 error code if the birthdate is after the current date", async () => {
            await request(app).patch(`${routePath}/users/customer2`).set("Cookie", adminCookie).
            send({ name: "test_update", surname: customer2.surname, address : "test", birthdate : "2026-01-01" }).
            expect(400)
        })
    })
    describe("DELETE ezelectronics/users", () => {
        test("It should delete all users except for admins", async () => {
            await request(app).delete(`${routePath}/users`).set("Cookie", adminCookie).expect(200)
            const users = await request(app) //I check if all non-admin users were correctly deleted 
                .get(`${routePath}/users`)
                .set("Cookie", adminCookie) 
            expect(users.body).toHaveLength(2)
            await postUser(customer)
            await postUser(customer2)
        })
        test("It should return a 401 error code if the caller user is not an admin", async () => {
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/users`).set("Cookie", customerCookie).expect(401)
        })
    })

})
describe("Access routes integration tests", () => {
    describe("POST ezelectronics/sessions", () => {
        test("It should allow login", async () => {
            const user = await request(app).post(`${routePath}/sessions`).
            send({username : customer.username, password : customer.password}).
            expect(200)
            let cust = user.body 
            expect(cust).toBeDefined() 
            expect(cust.username).toBe(customer.username)
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })
        test("It should return a 422 error code if at least one request body parameter is empty/missing", async () => {
            await request(app).post(`${routePath}/sessions`).
            send({username : "", password : customer.password}).
            expect(422)
            await request(app).post(`${routePath}/sessions`).
            send({username : customer.username}).
            expect(422)
        })
        test("It should return a 401 error code if the username doesn't exist", async () => {
            await request(app).post(`${routePath}/sessions`).
            send({username : "invalid", password : customer.password}).
            expect(401)
        })
        test("It should return a 401 error code if the password is incorrect", async () => {
            await request(app).post(`${routePath}/sessions`).
            send({username : customer.username, password : "invalid"}).
            expect(401)
        })
    })
    describe("GET ezelectronics/sessions/current", () => {
        test("It should retrieve information about the currently logged in user", async () => {
            customerCookie = await login(customer)
            const user = await request(app).get(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(200)
            let cust = user.body 
            expect(cust).toBeDefined() 
            expect(cust.username).toBe(customer.username)
            expect(cust.name).toBe(customer.name)
            expect(cust.surname).toBe(customer.surname)
            expect(cust.role).toBe(customer.role)
        })
        test("It should return a 401 error code if the user is not logged in", async () => {
            customerCookie = ""
            await request(app).get(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(401)
            await request(app).get(`${routePath}/sessions/current`).
            expect(401)
        })
    })
    describe("DELETE `ezelectronics/sessions/current", () => {
        test("It should logout the calling user", async () => {
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(200)
            await request(app).get(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(401) //I check that the user has logged out
        })
        test("It should return a 401 error code if the user is not logged in", async () => {
            customerCookie = await login(customer)
            await request(app).delete(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(200)
            await request(app).delete(`${routePath}/sessions/current`).set("Cookie", customerCookie).
            expect(401)
        })
    })
})