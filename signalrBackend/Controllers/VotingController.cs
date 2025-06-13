using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using signalrBackend.Hubs;
using signalrBackend.Services;

namespace signalrBackend.Controllers;

[ApiController]
[Route("api/voting")]
public class MyController : ControllerBase
{
    private readonly IHubContext<VotingHub> _votingHubContext;
    private readonly VotingService _votingService;
    private readonly ILogger<MyController> _logger;

    public MyController(
        IHubContext<VotingHub> votingHubContext, 
        VotingService votingService,
        ILogger<MyController> logger)
    {
        _votingHubContext = votingHubContext;
        _votingService = votingService;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        try
        {
            var results = _votingService.GetVotingResults();
            _logger.LogInformation("Retrieved voting results: {@Results}", results);
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving voting results");
            return StatusCode(500, "Error retrieving voting results");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] string value)
    {
        try
        {
            _logger.LogInformation("Received vote for: {Value}", value);

            if (string.IsNullOrEmpty(value))
            {
                _logger.LogWarning("Received empty vote value");
                return BadRequest("Vote value cannot be empty");
            }

            _votingService.AddVote(value);
            var results = _votingService.GetVotingResults();
            
            _logger.LogInformation("Updated voting results: {@Results}", results);
            
            await _votingHubContext.Clients.All.SendAsync("ReceiveVoteResults", results);
            return Ok($"You voted for: {value}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing vote for: {Value}", value);
            return StatusCode(500, $"Error processing vote: {ex.Message}");
        }
    }
}