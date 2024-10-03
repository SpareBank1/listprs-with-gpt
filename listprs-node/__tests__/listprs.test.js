import displayPRsForReview from "../listprs.js";


jest.mock("../githubPrs", () => ({

    getPRsByAuthor : jest.fn(() => Promise.resolve([
        { number: 1, author: { login: 'author1' }, title: 'Fix bug', createdAt: '2023-09-10T10:00:00Z', url: 'https://github.com/pr1' }
    ])),
    getPRsByPerson : jest.fn(() => Promise.resolve([
        { number: 2, author: { login: 'author2' }, title: 'Add feature', createdAt: '2023-09-12T08:30:00Z', url: 'https://github.com/pr2' }
    ])),
    getPRsByLabel : jest.fn(() => Promise.resolve([])),
    getPRsByTeams : jest.fn(() => Promise.resolve([
        { number: 3, author: { login: 'teammate' }, title: 'Improve performance', createdAt: '2023-09-15T10:00:00Z', url: 'https://github.com/pr3' }
    ])),
    getGitHubUsername : jest.fn(() => Promise.resolve("vidarmoe")),
}))

global.console = {
    log: jest.fn(),
};

describe('displayPRsForReview - sectioned output', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Reset mocks before each test
    });

    it('should display PRs in the correct sections without duplication', async () => {

        // Call the function to test
        await displayPRsForReview('test-label', ['team1', 'team2']);

        // Verify the output is in the correct sections
        expect(console.log).toHaveBeenNthCalledWith(1, '\x1b[34mPRs created by user:\x1b[0m');
        expect(console.log).toHaveBeenNthCalledWith(2, `${'\x1b[34mPR #1\x1b[0m'}
Author: author1
Title: Fix bug
Date: 9/10/2023
URL: https://github.com/pr1
`);

        expect(console.log).toHaveBeenNthCalledWith(3, '\x1b[34mPRs assigned to user:\x1b[0m');
        expect(console.log).toHaveBeenNthCalledWith(4, `${'\x1b[34mPR #2\x1b[0m'}
Author: author2
Title: Add feature
Date: 9/12/2023
URL: https://github.com/pr2
`);

        expect(console.log).toHaveBeenNthCalledWith(5, '\x1b[34mPRs by team and label:\x1b[0m');
        expect(console.log).toHaveBeenNthCalledWith(6, `${'\x1b[34mPR #3\x1b[0m'}
Author: teammate
Title: Improve performance
Date: 9/15/2023
URL: https://github.com/pr3
`);
    }, 10000); // Increase timeout to 10 seconds
});
