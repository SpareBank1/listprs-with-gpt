package no.sb1.listprs

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.io.ByteArrayOutputStream
import java.io.PrintStream

class PrFetcherTest {

    private val prFetcher = PrFetcher()

    @Test
    fun `test printPrs`() {
        val prsByAuthor = listOf(
            PrFetcher.PR(1, "Author PR 1", PrFetcher.Author("user"), "https://github.com/repo/pull/1", "2023-08-01T12:00:00Z"),
            PrFetcher.PR(3, "Author PR 2", PrFetcher.Author("user"), "https://github.com/repo/pull/3", "2023-08-03T12:00:00Z")
        )
        val prsByPerson = listOf(
            PrFetcher.PR(2, "Assigned PR 1", PrFetcher.Author("otherUser"), "https://github.com/repo/pull/2", "2023-08-02T12:00:00Z")
        )
        val prsByLabel = listOf(
            PrFetcher.PR(3, "Label PR 1", PrFetcher.Author("otherUser"), "https://github.com/repo/pull/4", "2023-08-04T12:00:00Z")
        )
        val prsByTeams = listOf(
            PrFetcher.PR(5, "Team PR 1", PrFetcher.Author("otherUser"), "https://github.com/repo/pull/5", "2023-08-05T12:00:00Z")
        )

        val outputStream = ByteArrayOutputStream()
        System.setOut(PrintStream(outputStream))

        prFetcher.printPrs(prsByAuthor, prsByPerson, prsByLabel, prsByTeams)

        val expectedOutput = """
            PRs created by user:
            \u001B[34mPR #1
            Author: user
            Title: Author PR 1
            Date: 2023-08-01T12:00:00Z
            URL: https://github.com/repo/pull/1
            \u001B[0m
            \u001B[34mPR #3
            Author: user
            Title: Author PR 2
            Date: 2023-08-03T12:00:00Z
            URL: https://github.com/repo/pull/3
            \u001B[0m
            
            PRs assigned to user:
            \u001B[34mPR #2
            Author: otherUser
            Title: Assigned PR 1
            Date: 2023-08-02T12:00:00Z
            URL: https://github.com/repo/pull/2
            \u001B[0m
            
            PRs by team and label:
            \u001B[34mPR #5
            Author: otherUser
            Title: Team PR 1
            Date: 2023-08-05T12:00:00Z
            URL: https://github.com/repo/pull/5
            \u001B[0m
        """.trimIndent().replace("\\u001B", "\u001B")

        assertEquals(expectedOutput, outputStream.toString().trim())
    }
}
