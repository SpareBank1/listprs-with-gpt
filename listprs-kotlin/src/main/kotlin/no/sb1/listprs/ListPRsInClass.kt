package no.sb1.listprs

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.io.BufferedReader

class PrFetcher {

    fun main(args: Array<String>) {

        val ghUsername = executeCommand("gh api user --jq '.login'").trim()
        val author = ghUsername
        val person = ghUsername
        val label = args[0]
        val teams = args.drop(1)

        val prsByLabel = fetchPrsByLabel(label)
        val prsByPerson = fetchPrsByPerson(person)
        val prsByAuthor = fetchPrsByAuthor(author)
        val prsByTeams = fetchPrsByTeams(teams)

        printPrs(prsByAuthor, prsByPerson, prsByLabel, prsByTeams)
    }

    fun fetchPrsByLabel(label: String): List<PR> {
        val command = "gh pr list --label \"$label\" --state open --json number,title,author,url,reviewRequests,createdAt"
        val prs = executeCommand(command)
        return parsePrs(prs)
    }

    fun fetchPrsByPerson(person: String): List<PR> {
        val command = "gh pr list --assignee \"$person\" --state open --json number,title,author,url,reviewRequests,createdAt"
        val prs = executeCommand(command)
        return parsePrs(prs)
    }

    fun fetchPrsByAuthor(author: String): List<PR> {
        val command = "gh pr list --author \"$author\" --state open --json number,title,author,url,reviewRequests,createdAt"
        val prs = executeCommand(command)
        return parsePrs(prs)
    }

    fun fetchPrsByTeams(teams: List<String>): List<PR> {
        val prsByTeams = mutableListOf<PR>()
        for (team in teams) {
            val command = "gh pr list --state open --json number,title,author,url,reviewRequests,createdAt | jq --arg team \"$team\" '[.[] | select(any(.reviewRequests[]?; .name? // \"\" | test($team))) | {number, title, author, url,createdAt}]'"
            val prs = executeCommand(command)
            prsByTeams.addAll(parsePrs(prs))
        }
        return prsByTeams
    }

    fun printPrs(prsByAuthor: List<PR>, prsByPerson: List<PR>, prsByLabel: List<PR>, prsByTeams: List<PR>) {
        val colorBlue = "\u001B[34m"
        val colorReset = "\u001B[0m"

        val uniquePrs = mutableSetOf<Int>()

        // Print PRs created by user
        println("PRs created by user:")
        prsByAuthor.sortedBy { it.createdAt }.forEach { pr ->
            if (uniquePrs.add(pr.number)) {
                printPr(pr, colorBlue, colorReset)
            }
        }

        // Print PRs assigned to user
        println("\nPRs assigned to user:")
        prsByPerson.sortedBy { it.createdAt }.forEach { pr ->
            if (uniquePrs.add(pr.number)) {
                printPr(pr, colorBlue, colorReset)
            }
        }

        // Print PRs by team and label
        println("\nPRs by team and label:")
        (prsByLabel + prsByTeams).sortedBy { it.createdAt }.forEach { pr ->
            if (uniquePrs.add(pr.number)) {
                printPr(pr, colorBlue, colorReset)
            }
        }
    }

    private fun printPr(pr: PR, colorBlue: String, colorReset: String) {
        println("${colorBlue}PR #${pr.number}\nAuthor: ${pr.author.login}\nTitle: ${pr.title}\nDate: ${pr.createdAt}\nURL: ${pr.url}\n$colorReset")
    }

    companion object {
        fun executeCommand(command: String): String {
            val process = ProcessBuilder("sh", "-c", command)
                .redirectErrorStream(true)
                .start()
            return process.inputStream.bufferedReader().use(BufferedReader::readText)
        }
    }

    fun parsePrs(json: String): List<PR> {
        val mapper = jacksonObjectMapper()
        return mapper.readValue(json)
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class PR(
        val number: Int,
        val title: String,
        val author: Author,
        val url: String,
        val createdAt: String
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class Author(
        val login: String
    )
}

fun main(args: Array<String>) {
    PrFetcher().main(args)
}
