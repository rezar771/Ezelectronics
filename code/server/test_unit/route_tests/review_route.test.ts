import { test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import { app } from '../../index';
import ReviewController from '../../src/controllers/reviewController';
import Authenticator from '../../src/routers/auth';
import { User, Role } from '../../src/components/user';

const baseURL = '/ezelectronics/reviews';

jest.mock('../../src/controllers/reviewController');
jest.mock('../../src/routers/auth');

beforeEach(() => {
    jest.clearAllMocks();
});

afterEach(() => {
    jest.resetAllMocks();
});

test('add review - 200', async () => {
    const testReview = {
        model: 'testModel',
        user: new User('testUser', 'Test', 'User', Role.CUSTOMER, '123 Test St', '2000-01-01'),
        score: 5,
        comment: 'testComment'
    };

    jest.spyOn(ReviewController.prototype, 'addReview').mockResolvedValueOnce();
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    });
    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    });

    const response = await request(app).post(`${baseURL}/testModel`).send(testReview);

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
        testReview.model,
        testReview.user,
        testReview.score,
        testReview.comment
    );
});
test("add review- invalid score-422", async () => {
    const testReview = {
        model: "testModel",
        user: "testUser",
        score: 8,
        comment: "testComment"
    }
    jest.spyOn(ReviewController.prototype, 'addReview').mockResolvedValueOnce()
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    const response = await request(app).post(`${baseURL}/testModel`).send(testReview)
    expect(response.status).toBe(422)
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)

    jest.clearAllMocks()
})
test("add review - error handling", async () => {
    const testReview = {
        model: "testModel",
        user: "testUser",
        score: 5,
        comment: "testComment"
    };

    const error = new Error("Database error");
    jest.spyOn(ReviewController.prototype, 'addReview').mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    });
    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    });

    const response = await request(app).post(`${baseURL}/testModel`).send(testReview);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Internal Server Error', status: 503 });
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
        testReview.model,
        testReview.user,
        testReview.score,
        testReview.comment
    );
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//get all reviews of a product:
test("Returns all reviews -200 ", async () => {
    const testModel = "testModel"
    const testReviews = [
        {
            model: testModel,
            user: "testUser",
            score: 5,
            comment: "testComment",
            date: "2021-10-10"
        },
        {
            model: testModel,
            user: "testUser2",
            score: 4,
            comment: "testComment2",
            date: "2021-10-11"
        }
    ]

    jest.spyOn(ReviewController.prototype, 'getProductReviews').mockResolvedValueOnce(testReviews)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    const response = await request(app).get(`${baseURL}/testModel`)
    expect(response.status).toBe(200)
    expect(response.body).toEqual(testReviews)
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(testModel)
    jest.clearAllMocks()
})
test("Returns all reviews -error handling ", async () => {
    const testModel = "testModel"
    const testReviews = [
        {
            model: testModel,
            user: "testUser",
            score: 5,
            comment: "testComment",
            date: "2021-10-10"
        },
        {
            model: testModel,
            user: "testUser2",
            score: 4,
            comment: "testComment2",
            date: "2021-10-11"
        }
    ]
    const error = new Error("Database error");
    jest.spyOn(ReviewController.prototype, 'getProductReviews').mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementationOnce((req, res, next) => next())
    const response = await request(app).get(`${baseURL}/testModel`)
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Internal Server Error', status: 503 });
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(testModel)
    jest.clearAllMocks()
})
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//delete a review from a product:
test("delete a review-200", async () => {
    const testReview = {
        model: "testModel",
        user: "testUser",
    }
    jest.spyOn(ReviewController.prototype, 'deleteReview').mockResolvedValueOnce()
    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    const response = await request(app).delete(`${baseURL}/testModel`).send(testReview)
    expect(response.status).toBe(200)
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
        testReview.model,
        testReview.user)
    jest.clearAllMocks()
})
test("delete a review-error handling", async () => {
    const testReview = {
        model: "testModel",
        user: "testUser",
    }
    const error = new Error("Database error");
    jest.spyOn(ReviewController.prototype, 'deleteReview').mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, 'isCustomer').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => {
        req.user = testReview.user;
        next();
    })
    const response = await request(app).delete(`${baseURL}/testModel`).send(testReview)
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Internal Server Error', status: 503 });
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
        testReview.model,
        testReview.user)
    jest.clearAllMocks()
})
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Test for the route that deletes all reviews of a product
test("delete all reviews of a product - 200", async () => {
    const testModel = "testModel";
    jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockResolvedValueOnce();
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementationOnce((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}/${testModel}/all`);

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testModel);

    jest.clearAllMocks();
});
test("delete all reviews of a product - error handling-503", async () => {
    const testModel = "testModel";
    const error = new Error("Database error");
    jest.spyOn(ReviewController.prototype, 'deleteReviewsOfProduct').mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementationOnce((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}/${testModel}/all`);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Internal Server Error', status: 503 });
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testModel);

    jest.clearAllMocks();
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Test for the route that deletes all reviews
test("delete all reviews - 200", async () => {
    jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockResolvedValueOnce();
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementationOnce((req, res, next) => next());

    const response = await request(app).delete(`${baseURL}`);

    expect(response.status).toBe(200);
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
});
test("delete all reviews - error handling-503", async () => {
    const error = new Error("Database error");
    jest.spyOn(ReviewController.prototype, 'deleteAllReviews').mockRejectedValueOnce(error);
    jest.spyOn(Authenticator.prototype, 'isLoggedIn').mockImplementationOnce((req, res, next) => next());
    jest.spyOn(Authenticator.prototype, 'isAdminOrManager').mockImplementationOnce((req, res, next) => next());

    const response = await request(app).delete(baseURL);

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'Internal Server Error', status: 503 });
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
});


