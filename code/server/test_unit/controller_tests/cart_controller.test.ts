import { test, expect, jest,beforeAll, afterAll,afterEach,describe } from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import UserDAO from "../../src/dao/userDAO";
import UserController from "../../src/controllers/userController";
import { Category, Product } from "../../src/components/product";
import { User, Role } from "../../src/components/user";
import { Cart, ProductInCart } from "../../src/components/cart";
import { CartNotFoundError } from "../../src/errors/cartError";
import { ProductNotFoundError } from "../../src/errors/productError";
import { Database } from "sqlite3";

afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
});
afterAll(()=>{

})

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters
const mockAuthenticateUser = jest.fn()
describe("CONTROLLER TEST",()=>{
    jest.mock("../../src/dao/cartDAO");
    test("Adding product to empty cart with authenticated user - Success", async () => {
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const testProduct = new Product(1, "test", Category.SMARTPHONE, "2024-04-05", "test", 10);
    
        mockAuthenticateUser.mockReturnValueOnce(true); // User is authenticated
        jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValueOnce(true); // Mock adding product
    
        const controller = new CartController(); // Inject mock authentication
    
        const response = await controller.addToCart(testUser, testProduct.model);
    
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledTimes(1); // Add product called with correct user and product IDs
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith(testUser, testProduct.model);
        expect(response).toBe(true); // Successful addition
    });
    
    
    test("Removing Product from Cart", async () => {
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const testProduct = new Product(1, "test", Category.SMARTPHONE, "2024-04-05", "test", 10);
    
        mockAuthenticateUser.mockReturnValueOnce(true); // User is authenticated
        jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValueOnce(true); // Mock adding product
    
        const controller = new CartController(); // Inject mock authentication
    
        const response = await controller.removeProductFromCart(testUser, testProduct.model);
    
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledTimes(1); // Add product called with correct user and product IDs
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith(testUser, testProduct.model);
        expect(response).toBe(true); // Successful addition
    
    });
    
    test("Removing all Products from Cart", async () => {
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
    
        mockAuthenticateUser.mockReturnValueOnce(true); // User is authenticated
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true); // Mock adding product
    
        const controller = new CartController(); // Inject mock authentication
    
        const response = await controller.clearCart(testUser);
    
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1); // called with correct user and product IDs


        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testUser);
        expect(response).toBe(true); // Successful addition
    
    });
    
    test("Retrieve Cart with element", async () => {
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const testProduct = new Product(1, "test", Category.SMARTPHONE, "2024-04-05", "test", 10);
        const productinCart = new ProductInCart("test",1,Category.SMARTPHONE,1)
        const testCart= new Cart("test_user",false,"",1,[productinCart]);
    
        mockAuthenticateUser.mockReturnValueOnce(testCart); // User is authenticated
        const mockGet=jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
         // Mock adding product
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.getCart(testUser);
    
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(mockGet).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
        mockGet.mockRestore();

    });
    
    test("Retrieve Cart with no element", async () => {
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const testProduct = new Product(1, "test", Category.SMARTPHONE, "2024-04-05", "test", 10);
        const testCart= new Cart("test_user",false,"",1,[]);
    
        mockAuthenticateUser.mockReturnValueOnce(testCart); // User is authenticated
        const mockGet=jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.getCart(testUser);
    
        // Aggiungere il prodotto al carrello
        // await controller.addToCart(testUser, testProduct.model);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(mockGet).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
        mockGet.mockRestore();
    });
    
    test("Checkout Cart", async()=>{
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const testProduct = new Product(1, "test", Category.SMARTPHONE, "2024-04-05", "test", 10);
        const productinCart = new ProductInCart("test",1,Category.SMARTPHONE,1)
        const testCart= new Cart("test_user",false,"",1,[productinCart]);
    
        mockAuthenticateUser.mockReturnValueOnce(testCart); // User is authenticated
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.checkoutCart(testUser);
    
        // Aggiungere il prodotto al carrello
       // await controller.addToCart(testUser, testProduct.model);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testUser);


});
    
    test("Retrieve all Carts", async()=>{
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const productinCart = new ProductInCart("test",1,Category.SMARTPHONE,1)
        const testCart= new Cart("test_user",false,"",1,[productinCart]);
        const testCart1= new Cart("test_user",false,"",10,[productinCart]);
        const carts:Cart[]=[];
        carts.push(testCart);
        carts.push(testCart1);
        mockAuthenticateUser.mockReturnValueOnce(carts); // User is authenticated
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(carts);
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.getAllCarts();
    
        // Aggiungere il prodotto al carrello
       // await controller.addToCart(testUser, testProduct.model);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
    });
    
    
    test("Delete all carts", async()=>{
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.deleteAllCarts();
    
        // Aggiungere il prodotto al carrello
       // await controller.addToCart(testUser, testProduct.model);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledWith();
    });

    test("Retrieve all Carts of a single user", async()=>{
        const testUser = new User("test_user", "Test", "Test", Role.CUSTOMER, "test_address", "2001-12-14"); // Create User instance
        const productinCart = new ProductInCart("test",1,Category.SMARTPHONE,1)
        const testCart= new Cart("test_user",false,"",1,[productinCart]);
        const testCart1= new Cart("test_user",false,"",10,[productinCart]);
        const carts:Cart[]=[];
        carts.push(testCart);
        carts.push(testCart1);
        mockAuthenticateUser.mockReturnValueOnce(carts); // User is authenticated
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce(carts);
        
        // Creazione di un'istanza del controller del carrello
        const controller = new CartController(); 
        const response = await controller.getCustomerCarts(testUser);
    
        // Aggiungere il prodotto al carrello
       // await controller.addToCart(testUser, testProduct.model);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata una volta
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
        
        // Verificare che la funzione getCart del DAO sia stata chiamata con il nome utente corretto
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser);
    });
})