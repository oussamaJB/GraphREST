const app=require('./app');
const request=require('supertest');
const {response} = require("express");

describe('POST /api/node',()=>{
    it("should return JSON for valid requests",() => {
        return request(app).post('/api/node')
            .send({"titre":"first title","description":"first description","condition":"$var"})
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: expect.any(Number),
                            titre: "first title",
                            description: "first description",
                            condition: "$var",
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });

    it("should reject requests with missing data",() => {
        return request(app).post('/api/node')
            .send({"titre":"","description":"first description","condition":"$var"})
            .expect('Content-Type',/json/)
            .expect(400)
    });

    it("should reject nodes with invalid conditions",() => {
        return request(app).post('/api/node')
            .send({"titre":"first","description":"first description","condition":"$var $var2"})
            .expect('Content-Type',/json/)
            .expect(400)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            error : "invalid condition"
                        }
                    )
                )
            })
    });

    // We will add additional tests because they will be beneficial while testing the other end-points

    it("additional test 1",() => {
        return request(app).post('/api/node')
            .send({"titre":"first title","description":"first description","condition":"$var"})
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: expect.any(Number),
                            titre: "first title",
                            description: "first description",
                            condition: "$var",
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });

    it("additional test 2",() => {
        return request(app).post('/api/node')
            .send({"titre":"second title","description":"second description","condition":"$var2"})
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: expect.any(Number),
                            titre: "second title",
                            description: "second description",
                            condition: "$var2",
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });

    it("additional test 3",() => {
        return request(app).post('/api/node')
            .send({"titre":"third title","description":"third description","condition":"$var3"})
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: expect.any(Number),
                            titre: "third title",
                            description: "third description",
                            condition: "$var3",
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });


});

describe('GET /api/node',()=>{
    it("should return the resource as JSON",() => {
        return request(app).get('/api/node/0')
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: 0,
                            titre: expect.any(String),
                            description: expect.any(String),
                            condition: expect.any(String),
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });

    it("should reject requests with invalid id",() => {
        return request(app).get('/api/node/100').expect('Content-Type',/json/).expect(404);
    });

});


describe('PUT /api/node',()=>{

    it("should sucessfully update existing nodes",() => {
        return request(app).put('/api/node/0').send({"titre":"updated title"})
            .expect('Content-Type',/json/)
            .expect(200)
            .then( (response) => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            id: expect.any(Number),
                            titre: "updated title",
                            description: expect.any(String),
                            condition: expect.any(String),
                            list_adj: expect.any(Array)
                        }
                    )
                )
            })
    });

    it("should reject requests that includes invalid data",() => {

        return request(app).put('/api/node/0')
            .send({"titre":"","description":"first description"})
            .expect('Content-Type',/json/)
            .expect(400)
    });

    it("should reject requests with invalid conditions",() => {
        return request(app).put('/api/node/0')
            .send({"condition":"$var $var2"})
            .expect('Content-Type',/json/)
            .expect(400)

    });

    it("should reject requests with invalid nodes",() => {
        return request(app).put('/api/node/100000000000')
            .send({"condition":"$var AND $var2"})
            .expect('Content-Type',/json/)
            .expect(404)

    });
});


describe('DELETE /api/node',()=>{
    it("should successfully delete existing nodes",() => {
        return request(app).delete('/api/node/0').expect(200);

    });

    it("should reject requests with invalid id",() => {
        return request(app).delete('/api/node/100').expect(404);
    });

});


describe("GET /api/connect",() => {
   it("should be able to connect 2 nodes",() => {
      return request(app).get(`/api/connect/1/2`).expect(200);
   });

    it("should reject requests with invalid nodes",() => {
        return request(app).get(`/api/connect/100/101`).expect(400);
    });

    it("should reject requests involving redundant links",() => {
        return request(app).get(`/api/connect/1/2`).expect(400);
    });

    // We will add some tests because they will be beneficial in the next end-points
    it("additional test 1",() => {
        return request(app).get(`/api/connect/2/1`).expect(200);
    });

    it("additional test 2",() => {
        return request(app).get(`/api/connect/2/3`).expect(200);
    });
});


describe("DELETE /api/connect",() => {

    it("should reject requests with invalid nodes",() => {
        return request(app).delete(`/api/connect/100/101`).expect(400);
    });

    it("should reject requests involving valid nodes but invalid links",() => {
        return request(app).delete(`/api/connect/1/3`).expect(400);
    });


});

describe("GET /api/shortest-path",() => {

    it("should correctly count the shortest path between 2 nodes",() => {
        request(app).get(`/api/shortest-path/1/2`).expect(200).then(
            response => {
                expect(response.body).toEqual(
                    expect.objectContaining({
                            distance : 1
                        }
                    )
                )

            }
        );
    });

    it("should reject requests with invalid nodes",() => {
        return request(app).get(`/api/shortest-path/100/101`).expect(400);
    });
});


describe("GET /api/cycles", () => {
    it("should successfully detect cycles in the graph and return them as array",() => {
        return request(app).get(`/api/cycles`).expect(200).then(
            response => {
                expect(response.body).toEqual(
                    [ [1,2,1] ]
                )
            }
        );;
    });
});