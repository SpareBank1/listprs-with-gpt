// githubUtils.test.js

import { combinePullRequests, printPullRequestsWithHeader } from '../githubUtils.js';

describe('combinePullRequests', () => {
    it('skal kombinere flere pull request-lister og fjerne duplikater', () => {
        const list1 = [
            { number: 1, createdAt: '2021-01-01T00:00:00Z' },
            { number: 2, createdAt: '2021-01-02T00:00:00Z' },
        ];
        const list2 = [
            { number: 2, createdAt: '2021-01-02T00:00:00Z' },
            { number: 3, createdAt: '2021-01-03T00:00:00Z' },
        ];
        const combined = combinePullRequests([list1, list2]);
        expect(combined).toEqual([
            { number: 1, createdAt: '2021-01-01T00:00:00Z' },
            { number: 2, createdAt: '2021-01-02T00:00:00Z' },
            { number: 3, createdAt: '2021-01-03T00:00:00Z' },
        ]);
    });
});

describe('printPullRequestsWithHeader', () => {
    let consoleSpy;

    beforeEach(() => {
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('skal skrive ut overskrift og pull requests', () => {
        const header = 'PRer opprettet av brukeren:';
        const pullRequests = [
            {
                number: 1,
                title: 'Oppdatering av README',
                author: { login: 'bruker1' },
                url: 'https://github.com/repo/pull/1',
                createdAt: '2021-01-01T00:00:00Z',
            },
        ];

        printPullRequestsWithHeader(header, pullRequests);

        expect(consoleSpy).toHaveBeenCalledWith(`${header}\n`);
        expect(consoleSpy).toHaveBeenCalledWith(`PR #${pullRequests[0].number}`);
        expect(consoleSpy).toHaveBeenCalledWith(`Forfatter: ${pullRequests[0].author.login}`);
        expect(consoleSpy).toHaveBeenCalledWith(`Tittel: ${pullRequests[0].title}`);
        expect(consoleSpy).toHaveBeenCalledWith(`Dato: ${pullRequests[0].createdAt}`);
        expect(consoleSpy).toHaveBeenCalledWith(`URL: ${pullRequests[0].url}\n`);
    });

    it('skal skrive ut melding når listen er tom', () => {
        const header = 'PRer opprettet av brukeren:';
        const pullRequests = [];

        printPullRequestsWithHeader(header, pullRequests);

        expect(consoleSpy).toHaveBeenCalledWith(`${header}\nIngen PRer funnet.\n`);
    });
});
