test('should do somthomy', () => {
    expect(1 + 2).toBe(3)
})

const worker3 = function (value) {

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (value == 3) resolve(true)
            else reject('Not equal')
        }, 1000)
    })


}
test('should promise work', (done) => {
    worker3(3).then((result) => {
        expect(result).toBe(true)
        done()
    }).catch((err) => {

    });
})

test('should async work', async () => {
    const value = await worker3('3')
    expect(value).toBe(true)
})
