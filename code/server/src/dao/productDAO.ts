import db from "../db/db";
import { Product } from "../components/product";
import {
  ProductNotFoundError,
  ProductAlreadyExistsError,
  EmptyProductStockError,
  LowProductStockError,
} from "../errors/productError";
import { DateError } from "../utilities";
/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {
  registerProducts(
    model: string,
    category: string,
    quantity: number,
    details: string | null,
    sellingPrice: number,
    arrivalDate: string | null
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Check if arrivalDate is after the current date
        if (arrivalDate && new Date(arrivalDate) > new Date()) {
          reject(new DateError());
          return;
        }
        if (!arrivalDate) {
          arrivalDate = new Date().toISOString().slice(0, 10);
        }
        // Check if model already exists in the database
        const sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) reject(err);
          if (row) {
            reject(new ProductAlreadyExistsError());
          } else {
            // Insert new product into the database
            db.run(
              `INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) 
                            VALUES (?, ?, ?, ?, ?, ?)`,
              [model, category, quantity, details, sellingPrice, arrivalDate],
              (err: Error | null) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              }
            );
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  changeProductQuantity(
    model: string,
    newQuantity: number,
    changeDate: string | null
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        // Check if changeDate is after the current date
        if (changeDate && new Date(changeDate) > new Date()) {
          reject(new DateError());
          return;
        }
        if (!changeDate) {
          changeDate = new Date().toISOString().slice(0, 10);
        }
        // Get the product from the database
        const sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (err) reject(err);
          if (!row) {
            reject(new ProductNotFoundError());
          } else {
            // Check if changeDate is before the product's arrivalDate
            if (
              changeDate &&
              row.arrivalDate &&
              new Date(changeDate) < new Date(row.arrivalDate)
            ) {
              reject(new DateError());
              return;
            }
            // Calculate new quantity
            const updatedQuantity = row.quantity + newQuantity;

            // Update the quantity in the database
            const sql = "UPDATE products SET quantity = ? WHERE model = ?";
            db.run(sql, [updatedQuantity, model], function (err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(updatedQuantity);
              }
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  sellProduct(
    model: string,
    quantity: number,
    sellingDate: string | null
  ): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      try {
        // Check if changeDate is after the current date
        if (sellingDate && new Date(sellingDate) > new Date()) {
          reject(new DateError());
          return;
        }
        // Get the product from the database
        const sql = "SELECT * FROM products WHERE model = ?";
        db.get(sql, [model], (err: Error | null, row: any) => {
          if (!row) {
            reject(new ProductNotFoundError());
          } else {
            // Check if changeDate is before the product's arrivalDate
            if (
              sellingDate &&
              row.arrivalDate &&
              new Date(sellingDate) < new Date(row.arrivalDate)
            ) {
              reject(new DateError());
              return;
            }
            // Check if the available quantity is 0
            if (row.quantity === 0) {
              reject(new EmptyProductStockError());
              return;
            }

            // Check if the available quantity is lower than the requested quantity
            if (row.quantity < quantity) {
              reject(new LowProductStockError());
              return;
            }

            // Calculate new quantity
            const updatedQuantity = row.quantity - quantity;

            const sql = "UPDATE products SET quantity = ? WHERE model = ?";
            db.run(sql, [updatedQuantity, model], function (err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(updatedQuantity);
              }
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      try {
        let query = "SELECT * FROM products";

        if (grouping === "category" && category) {
          query += ` WHERE category = '${category}'`;
        } else if (grouping === "model" && model) {
          query += ` WHERE model = '${model}'`;
        }

        db.all(query, (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
          } else {
            if (grouping === "model" && model && rows.length === 0) {
              reject(new ProductNotFoundError());
            } else {
              resolve(rows);
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getAvailableProducts(
    grouping: string | null,
    category: string | null,
    model: string | null
  ): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      try {
        let query = "SELECT * FROM products WHERE quantity > 0";

        if (grouping === "category" && category) {
          query += ` AND category = '${category}'`;
        } else if (grouping === "model" && model) {
          query += ` AND model = '${model}'`;
        }

        db.all(query, (err: Error | null, rows: any) => {
          if (err) {
            reject(err);
          } else {
            if (grouping === "model" && model && rows.length === 0) {
               // Checks whether the product exists regardless of the quantity
            let checkExistenceQuery = `SELECT * FROM products WHERE model = '${model}'`;

            db.all(checkExistenceQuery, (existErr: Error | null, existRows: any) => {
              if (existErr) {
                reject(existErr);
              } else {
                if (existRows.length === 0) {
                  reject(new ProductNotFoundError());
                } else {
                  resolve([]); // The product exists but is not available
                }
              }
            });
            } else {
              resolve(rows);
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteAllProducts(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const query = "DELETE FROM products";

        db.run(query, function (err: Error) {
          if (err) {
            reject(err);
          } else {
            // Check if any row has been affected
            if (this.changes > 0) {
              resolve(true);
            } else {
              resolve(false);
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteProduct(model: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        const query = "DELETE FROM products WHERE model = ?";

        db.run(query, [model], function (err: Error) {
          if (err) {
            reject(err);
          } else {
            // Check if any row has been affected
            if (this.changes > 0) {
              resolve(true);
            } else {
              reject(new ProductNotFoundError());
            }
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default ProductDAO;
