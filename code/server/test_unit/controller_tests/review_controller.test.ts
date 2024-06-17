import {test, expect, jest, beforeEach, afterEach, beforeAll, afterAll} from "@jest/globals";
import ReviewController from "../../src/controllers/reviewController";
import ReviewDAO from "../../src/dao/reviewDAO";
import { User, Role } from "../../src/components/user";
import { ProductReview } from "../../src/components/review";
jest.mock("../../src/dao/reviewDAO");


beforeAll(() => {
    // Setup before all tests
})

afterAll(() => {
    // Cleanup after all tests
})
const reviewController = new ReviewController();
const user = new User("testUser", "Test", "User", Role.CUSTOMER, "123 Test St", "2000-01-01");
//add review test:
test("addReview should call ReviewDAO.addReview and return its result", async () => {
    const addReviewMock = jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue(undefined);

    const result = await reviewController.addReview("testModel", user, 5, "Great product!");

    expect(result).toBeUndefined();
    expect(addReviewMock).toHaveBeenCalledTimes(1);
    expect(addReviewMock).toHaveBeenCalledWith("testModel", user, 5, "Great product!");

    addReviewMock.mockRestore();
});
//getProductReviews test:
test("getProductReviews should call ReviewDAO.getProductReviews and return its result", async () => {
    const reviews = [
        new ProductReview("testModel", "user1", 5, "2024-01-01", "Great product!"),
        new ProductReview("testModel", "user2", 4, "2024-01-02", "Good product!")
    ];
    const getProductReviewsMock = jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValue(reviews);

    const result = await reviewController.getProductReviews("testModel");

    expect(result).toEqual(reviews);
    expect(getProductReviewsMock).toHaveBeenCalledTimes(1);
    expect(getProductReviewsMock).toHaveBeenCalledWith("testModel");

    getProductReviewsMock.mockRestore();
});
//deleteReview test:
test("deleteReview should call ReviewDAO.deleteReview and return its result", async () => {
    const deleteReviewMock = jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValue(undefined);

    const result = await reviewController.deleteReview("testModel", user);

    expect(result).toBeUndefined();
    expect(deleteReviewMock).toHaveBeenCalledTimes(1);
    expect(deleteReviewMock).toHaveBeenCalledWith("testModel", user);

    deleteReviewMock.mockRestore();
});
//deleteReviewsOfProduct test:
test("deleteReviewsOfProduct should call ReviewDAO.deleteReviewsOfProduct and return its result", async () => {
    const deleteReviewsOfProductMock = jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValue(undefined);

    const result = await reviewController.deleteReviewsOfProduct("testModel");

    expect(result).toBeUndefined();
    expect(deleteReviewsOfProductMock).toHaveBeenCalledTimes(1);
    expect(deleteReviewsOfProductMock).toHaveBeenCalledWith("testModel");

    deleteReviewsOfProductMock.mockRestore();
});
//deleteAllReviews test:
test("deleteAllReviews should call ReviewDAO.deleteAllReviews and return its result", async () => {
    const deleteAllReviewsMock = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValue(undefined);

    const result = await reviewController.deleteAllReviews();

    expect(result).toBeUndefined();
    expect(deleteAllReviewsMock).toHaveBeenCalledTimes(1);

    deleteAllReviewsMock.mockRestore();
});

