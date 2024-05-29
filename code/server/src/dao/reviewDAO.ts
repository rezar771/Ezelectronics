import db from "../db/db";
import { User } from "../components/user";
import { ProductNotFoundError } from "../errors/productError";
import {
  ExistingReviewError,
  NoReviewProductError,
} from "../errors/reviewError";
import { ProductReview } from "../components/review";
/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
  addReview(
    model: string,
    user: User,
    score: number,
    comment: string
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // Check if the product exists
        const checkProductSql = `
                SELECT COUNT(*) AS count
                FROM products
                WHERE model = ?
            `;
        db.get(checkProductSql, [model], (err: Error | null, row: any) => {
          if (err) {
            reject(err);
            return;
          }

          if (row.count === 0) {
            reject(new ProductNotFoundError());
            return;
          }

          // Check if the review already exists for the product made by the user
          const checkReviewSql = `
                    SELECT COUNT(*) AS count
                    FROM reviews
                    WHERE model = ? AND user = ?
                `;
          db.get(
            checkReviewSql,
            [model, user.username],
            (err: Error | null, row: any) => {
              if (err) {
                reject(err);
                return;
              }

              if (row.count > 0) {
                reject(new ExistingReviewError());
                return;
              }

              // Insert the new review
              const currentDate = new Date().toISOString().slice(0, 10);
              const insertReviewSql = `
                        INSERT INTO reviews (model, user, score, date, comment)
                        VALUES (?, ?, ?, ?, ?)
                    `;
              db.run(
                insertReviewSql,
                [model, user.username, score, currentDate, comment],
                (err: Error | null) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  resolve();
                }
              );
            }
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getProductReviews(model: string): Promise<ProductReview[]> {
    return new Promise((resolve, reject) => {
      try {
        const sql = `
            SELECT * 
            FROM reviews 
            WHERE model = ?
        `;

        db.all(sql, [model], (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const reviews: ProductReview[] = rows.map((row) => ({
            model: row.model,
            user: row.user,
            score: row.score,
            date: row.date,
            comment: row.comment,
          }));

          resolve(reviews);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  deleteReview(model: string, user: User): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if the product exists
      const productSql = `
            SELECT model FROM products WHERE model = ?
        `;
      db.get(productSql, [model], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new Error("Product not found"));
          return;
        }

        // Check if the user has a review for the product
        const reviewSql = `
                SELECT model FROM reviews WHERE model = ? AND user = ?
            `;
        db.get(
          reviewSql,
          [model, user.username],
          (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }
            if (!row) {
              reject(new ProductNotFoundError());
              return;
            }

            // Delete the review
            const deleteSql = `
                    DELETE FROM reviews 
                    WHERE model = ? AND user = ?
                `;
            db.run(
              deleteSql,
              [model, user.username],
              function (err: Error | null) {
                if (err) {
                  reject(err);
                  return;
                }

                if (this.changes === 0) {
                  reject(new NoReviewProductError());
                  return;
                }

                resolve();
              }
            );
          }
        );
      });
    });
  }
  deleteReviewsOfProduct(model: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if the product exists
      const productSql = `
            SELECT model FROM products WHERE model = ?
        `;
      db.get(productSql, [model], (err: Error | null, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          reject(new ProductNotFoundError());
          return;
        }

        // Delete all reviews of the product
        const deleteSql = `
                DELETE FROM reviews WHERE model = ?
            `;
        db.run(deleteSql, [model], function (err: Error | null) {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    });
  }

  deleteAllReviews(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteSql = `
            DELETE FROM reviews
        `;
      db.run(deleteSql, function (err: Error | null) {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

export default ReviewDAO;
