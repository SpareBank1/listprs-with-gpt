package no.sb1.listprs

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.io.BufferedReader
import java.io.InputStreamReader
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

fun main(args: Array<String>) {
    println("PRer for review:\n")

    val ghUsername = executeCommand("gh api user --jq '.login'").trim()
    val author = ghUsername
    val person = ghUsername
    val label = args[0]
    val teams = args.drop(1)

    val prsByLabel = fetchPrsByLabel(label)
    val prsByPerson = fetchPrsByPerson(person)
    val prsByAuthor = fetchPrsByAuthor(author)
    val prsByTeams = fetchPrsByTeams(teams)

    val combinedPrs = combinePrs(prsByLabel, prsByPerson, prsByAuthor, prsByTeams)
    printPrs(combinedPrs)
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

fun combinePrs(vararg prsLists: List<PR>): List<PR> {
    return prsLists.flatMap { it }
        .distinctBy { it.number }
        .sortedBy { it.createdAt }
}

fun printPrs(prs: List<PR>) {
    val colorBlue = "\u001B[34m"
    val colorReset = "\u001B[0m"

    prs.forEach {
        println("$colorBlue PR #${it.number}\nAuthor: ${it.author}\nTitle: ${it.title}\nDate: ${it.createdAt}\nURL: ${it.url}\n$colorReset")
    }
}

fun executeCommand(command: String): String {
    val process = ProcessBuilder("sh", "-c", command)
        .redirectErrorStream(true)
        .start()
    return process.inputStream.bufferedReader().use(BufferedReader::readText)
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
