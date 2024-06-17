import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals"
import request from 'supertest'
import { cleanup } from "../src/db/cleanup"
import { app } from "../index"
import db from "../src/db/db"


const routePath = "/ezelectronics";

const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" };
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" };
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" };
let adminCookie: string;
let customerCookie: string;
let managerCookie: string;

const product = {
    model: "iPhone14",
    category: "Smartphone",
    quantity: 100,
    details: "Latest model",
    sellingPrice: 999.99,
    arrivalDate: "2023-01-01"
};

const product2 = {
    model: "GalaxyS21",
    category: "Smartphone",
    quantity: 50,
    details: "Latest model from Samsung",
    sellingPrice: 799.99,
    arrivalDate: "2023-01-01"
};

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200);
};

const postProduct = async (productInfo: any) => {
    await request(app)
        .post(`${routePath}/products`)
        .set("Cookie", adminCookie)
        .send(productInfo)
        .expect(200);
};

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err);
                }
                console.log(res.header["set-cookie"]);
                resolve(res.header["set-cookie"][0]);
            });
    });
};

beforeAll(async () => {
    await postUser(admin);
    adminCookie = await login(admin);
    await postUser(manager);
    managerCookie = await login(manager);
    await postUser(customer);
    customerCookie = await login(customer);

    await postProduct(product);
    await postProduct(product2);
});

afterAll(() => {
    cleanup();
});


describe("cart routes integration test", ()=>{

    describe("GET /history", ()=>{

        test("It should return an empty array if there is no cart history", async () => {
            const response = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.body).toEqual([]);
        });

        test("It should not include the current unpaid cart in the history", async () => {
            // Aggiungi un prodotto al carrello
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: product.model })
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.body).toEqual([]);

            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(200);
        });
        test("It should return the cart history of the logged in customer", async () => {
            // Aggiungi un prodotto al carrello
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: product.model })
                .expect(200);

            // Checkout del carrello
            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].customer).toBe("customer");
            expect(response.body[0].paid).toBe("true");
            expect(response.body[0].products).toHaveLength(1);
            expect(response.body[0].products[0].model).toBe(product.model);
        });

        test("It should return 401 if the user is not authenticated", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .expect(401);
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .get(`${routePath}/carts/history`)
                .set("Cookie", adminCookie)
                .expect(401);
        });
    })
    describe("GET /carts", ()=>{

        test("It should return the cart of the logged in customer and return 200", async () => {
            // Aggiungi un prodotto al carrello
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Recupera il carrello del cliente loggato
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.status).toBe(200);
            expect(response.body.customer).toBe("customer");
            expect(response.body.products.length).toBeGreaterThan(0);
            expect(response.body.products[0].model).toBe("iPhone14");
            expect(response.body.total).toBe(999.99);

            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(200);
        });

        test("It should return a 401 code if the user is not logged in", async () => {
            const response = await request(app).get(`${routePath}/carts`).send();

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Unauthenticated user');
        });

        test("It should return an empty cart if no products are in the cart", async () => {
            // Assumendo che il carrello sia vuoto per questo test
            const response = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.body).toEqual({
                customer: 'customer',
                paid: false,
                paymentDate: null,
                total: 0,
                products: []
            });
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(401);
        });

        test("It should return the cart with multiple products", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "GalaxyS21" })
                .expect(200);

            const response = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.body.customer).toBe("customer");
            expect(response.body.products).toHaveLength(2);

            const product = response.body.products.find((p: any) => p.model === "iPhone14");
            const product2 = response.body.products.find((p: any) => p.model === "GalaxyS21");

            expect(product).toBeDefined();
            expect(product.quantity).toBe(1);
            expect(product.price).toBe(999.99);

            expect(product2).toBeDefined();
            expect(product2.quantity).toBe(1);
            expect(product2.price).toBe(799.99);

            expect(response.body.total).toBeCloseTo(999.99 + 799.99);

            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(200);

            await request(app)
                .delete(`${routePath}/carts/products/GalaxyS21`)
                .set("Cookie", customerCookie)
                .expect(200);
        });
    });
    
    describe("POST /carts", ()=>{

        test("It should add a product to the cart and return 200", async () => {
            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: product.model })
                .expect(200);

            expect(response.status).toBe(200);

            const cartResponse = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(cartResponse.body.customer).toBe("customer");
            expect(cartResponse.body.products).toHaveLength(1);
            expect(cartResponse.body.products[0].model).toBe(product.model);
            expect(cartResponse.body.products[0].quantity).toBe(1);

            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(200);
        });

        test("It should return 422 if the model is missing", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({})
                .expect(422);
        });
        test("It should return 404 if the product does not exist", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "NonExistentModel" })
                .expect(404);
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .send({ model: "iPhone14" })
                .expect(401);
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .send({ model: "iPhone14" })
                .expect(401);
        });

        test("It should increase product quantity in the cart if the product is already in the cart", async () => {
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: product.model })
                .expect(200);

            const response = await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: product.model })
                .expect(200);

            expect(response.status).toBe(200);

            const cartResponse = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(cartResponse.body.customer).toBe("customer");
            expect(cartResponse.body.products).toHaveLength(1);
            expect(cartResponse.body.products[0].model).toBe(product.model);
            expect(cartResponse.body.products[0].quantity).toBe(2);
        });
    });

    describe("PATCH /carts/:model", () => {
        test("It should checkout the cart and return 200", async () => {
            // Aggiungi un prodotto al carrello prima del checkout
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.status).toBe(200);
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .expect(401);
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(401);
        });

        test("It should return 404 if the cart is not found", async () => {
            const response = await request(app)
                .patch(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(404);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Cart not found');
        });

        test("It should return 404 if the product is not in the cart", async () => {
            await request(app)
                .patch(`${routePath}/carts/NonExistentModel`)
                .set("Cookie", customerCookie)
                .send({ quantity: 1 })
                .expect(404);
        });
    });

    describe("DELETE /carts/products/:model", ()=>{

        test("It should remove a product from the cart and return 200", async () => {
            // Aggiungi un prodotto al carrello prima di rimuoverlo
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            const response = await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.status).toBe(200);
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .expect(401);
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", adminCookie)
                .expect(401);
        });

        test("It should return 404 if the product is not found in the cart", async () => {
            const response = await request(app)
                .delete(`${routePath}/carts/products/NonExistentProduct`)
                .set("Cookie", customerCookie)
                .expect(404);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found');
        });

        test("It should return 404 if the product not in the cart", async () => {
            const response = await request(app)
                .delete(`${routePath}/carts/products/iPhone14`)
                .set("Cookie", customerCookie)
                .expect(404);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not in cart');
        });
    });

    describe("DELETE /carts/current", () => {
        test("It should clear the cart and return 200", async () => {
            // Aggiungi un prodotto al carrello prima di svuotarlo
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Svuota il carrello
            const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(response.status).toBe(200);

            // Verifica che il carrello sia vuoto
            const cartResponse = await request(app)
                .get(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(200);

            expect(cartResponse.body.products).toHaveLength(0);
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .expect(401);
        });

        test("It should return 401 if the user is not a customer", async () => {
            await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", adminCookie)
                .expect(401);
        });

        test("It should return 404 if the cart is not found", async () => {
            const response = await request(app)
                .delete(`${routePath}/carts/current`)
                .set("Cookie", customerCookie)
                .expect(404);

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Cart not found');
        });
    });
    
    describe("DELETE /carts", () => {
        test("It should delete all carts and return 200", async () => {
            // Aggiungi un prodotto al carrello prima di eliminarli tutti
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Elimina tutti i carrelli
            const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", adminCookie)
                .expect(200);

            expect(response.status).toBe(200);
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .expect(401);
        });

        test("It should return 401 if the user is not an admin or manager", async () => {
            await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test("It should allow manager to delete all carts and return 200", async () => {
            // Aggiungi un prodotto al carrello prima di eliminarli tutti
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Elimina tutti i carrelli
            const response = await request(app)
                .delete(`${routePath}/carts`)
                .set("Cookie", managerCookie)
                .expect(200);

            expect(response.status).toBe(200);
        });
    });

    describe("GET /carts/all", () => {
        test("It should return all carts and return 200", async () => {
            // Aggiungi un prodotto al carrello
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Recupera tutti i carrelli
            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", adminCookie)
                .expect(200);

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].customer).toBe("customer");
            expect(response.body[0].products.length).toBeGreaterThan(0);
            expect(response.body[0].products[0].model).toBe("iPhone14");
        });

        test("It should return 401 if the user is not logged in", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .expect(401);
        });

        test("It should return 401 if the user is not an admin or manager", async () => {
            await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", customerCookie)
                .expect(401);
        });

        test("It should allow manager to get all carts and return 200", async () => {
            // Aggiungi un prodotto al carrello
            await request(app)
                .post(`${routePath}/carts`)
                .set("Cookie", customerCookie)
                .send({ model: "iPhone14" })
                .expect(200);

            // Recupera tutti i carrelli
            const response = await request(app)
                .get(`${routePath}/carts/all`)
                .set("Cookie", managerCookie)
                .expect(200);

            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].customer).toBe("customer");
            expect(response.body[0].products.length).toBeGreaterThan(0);
            expect(response.body[0].products[0].model).toBe("iPhone14");
        });
    });
})