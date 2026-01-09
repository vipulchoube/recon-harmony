import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Server, Bot, Brain, DollarSign, Lightbulb } from "lucide-react";
import PptxGenJS from "pptxgenjs";

type TableRow = { text: string; options?: Record<string, unknown> }[];

const TechStackPresentation = () => {
  const generatePowerPoint = () => {
    const pptx = new PptxGenJS();
    pptx.author = "Agentic Reconciliation Platform";
    pptx.title = "Technology Stack Overview";
    pptx.subject = "Infrastructure, Agentic Frameworks & LLMs";

    // Slide 1: Title
    const slide1 = pptx.addSlide();
    slide1.addText("Agentic Reconciliation Platform", {
      x: 0.5, y: 2, w: 9, h: 1.5,
      fontSize: 36, bold: true, color: "1a365d",
      align: "center"
    });
    slide1.addText("Technology Stack Overview", {
      x: 0.5, y: 3.2, w: 9, h: 0.8,
      fontSize: 24, color: "4a5568",
      align: "center"
    });
    slide1.addText("Infrastructure • Agentic Frameworks • LLMs", {
      x: 0.5, y: 4.2, w: 9, h: 0.5,
      fontSize: 16, color: "718096",
      align: "center"
    });

    // Slide 2: Infrastructure
    const slide2 = pptx.addSlide();
    slide2.addText("1. Infrastructure Options", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: "1a365d"
    });
    
    const infraRows: TableRow[] = [
      [{ text: "Provider", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Compute", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Database", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Serverless", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Storage", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } }],
      [{ text: "AWS" }, { text: "EC2, ECS, EKS" }, { text: "RDS PostgreSQL, Aurora" }, { text: "Lambda" }, { text: "S3" }],
      [{ text: "Azure" }, { text: "App Service, AKS" }, { text: "Azure SQL, Cosmos DB" }, { text: "Azure Functions" }, { text: "Blob Storage" }],
      [{ text: "GCP" }, { text: "Cloud Run, GKE" }, { text: "Cloud SQL, Firestore" }, { text: "Cloud Functions" }, { text: "Cloud Storage" }]
    ];
    
    slide2.addTable(infraRows, {
      x: 0.3, y: 1, w: 9.4,
      fontSize: 11,
      border: { pt: 0.5, color: "cccccc" },
      align: "center",
      valign: "middle"
    });

    slide2.addText("Key Considerations:", {
      x: 0.5, y: 3.5, w: 9, h: 0.4,
      fontSize: 14, bold: true, color: "2d3748"
    });
    slide2.addText("• AWS: Most mature ecosystem, widest service selection\n• Azure: Best for Microsoft stack integration, strong enterprise support\n• GCP: Cost-effective, excellent for AI/ML workloads", {
      x: 0.5, y: 3.9, w: 9, h: 1.2,
      fontSize: 12, color: "4a5568"
    });

    // Slide 3: Agentic Frameworks
    const slide3 = pptx.addSlide();
    slide3.addText("2. Agentic Frameworks Comparison", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: "1a365d"
    });

    const frameworkRows: TableRow[] = [
      [{ text: "Framework", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Best For", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Learning Curve", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Key Features", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } }],
      [{ text: "LangChain" }, { text: "General-purpose chains" }, { text: "Medium" }, { text: "Modular, extensive integrations" }],
      [{ text: "LangGraph" }, { text: "Complex stateful workflows" }, { text: "Medium-High" }, { text: "Graph-based, cycles support" }],
      [{ text: "CrewAI" }, { text: "Multi-agent collaboration" }, { text: "Low" }, { text: "Role-based agents, simple API" }],
      [{ text: "AutoGen" }, { text: "Conversational agents" }, { text: "Medium" }, { text: "Microsoft-backed, multi-agent chat" }]
    ];

    slide3.addTable(frameworkRows, {
      x: 0.3, y: 1, w: 9.4,
      fontSize: 11,
      border: { pt: 0.5, color: "cccccc" },
      align: "center",
      valign: "middle"
    });

    // Slide 4: LangChain Code Example
    const slide4 = pptx.addSlide();
    slide4.addText("LangChain Implementation", {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: "1a365d"
    });

    const langchainCode = `from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.tools import Tool

def match_records(ledger_record: str, statement_record: str) -> str:
    """Match ledger and statement records"""
    return "MATCH" or "EXCEPTION_CODE"

tools = [
    Tool(name="match_records", func=match_records,
         description="Match ledger and statement records")
]

llm = ChatOpenAI(model="gpt-4o", temperature=0)
agent = create_openai_tools_agent(llm, tools, prompt)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

result = executor.invoke({"ledger": ledger_data, "statement": statement_data})`;

    slide4.addText(langchainCode, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.2,
      fontSize: 9,
      fontFace: "Courier New",
      fill: { color: "f7fafc" },
      color: "2d3748",
      valign: "top"
    });

    // Slide 5: LangGraph Code Example
    const slide5 = pptx.addSlide();
    slide5.addText("LangGraph Implementation", {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: "1a365d"
    });

    const langgraphCode = `from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class ReconciliationState(TypedDict):
    records: List[dict]
    current_index: int
    results: List[dict]

def analyze_record(state: ReconciliationState) -> ReconciliationState:
    record = state["records"][state["current_index"]]
    result = llm.invoke(f"Analyze: {record}")
    state["results"].append(result)
    state["current_index"] += 1
    return state

def should_continue(state: ReconciliationState) -> str:
    if state["current_index"] >= len(state["records"]):
        return END
    return "analyze"

workflow = StateGraph(ReconciliationState)
workflow.add_node("analyze", analyze_record)
workflow.add_conditional_edges("analyze", should_continue)
app = workflow.compile()`;

    slide5.addText(langgraphCode, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.2,
      fontSize: 9,
      fontFace: "Courier New",
      fill: { color: "f7fafc" },
      color: "2d3748",
      valign: "top"
    });

    // Slide 6: CrewAI Code Example
    const slide6 = pptx.addSlide();
    slide6.addText("CrewAI Implementation", {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: "1a365d"
    });

    const crewaiCode = `from crewai import Agent, Task, Crew

data_analyst = Agent(
    role="Data Analyst",
    goal="Analyze discrepancies between ledger and statement",
    backstory="Expert in financial data reconciliation",
    llm="gpt-4o"
)

exception_classifier = Agent(
    role="Exception Classifier",
    goal="Categorize exceptions with proper codes",
    backstory="Specialist in reconciliation exception handling",
    llm="gpt-4o"
)

analysis_task = Task(
    description="Compare {ledger_record} with {statement_record}",
    agent=data_analyst,
    expected_output="Detailed comparison analysis"
)

crew = Crew(
    agents=[data_analyst, exception_classifier],
    tasks=[analysis_task, classification_task],
    verbose=True
)
result = crew.kickoff(inputs={"ledger_record": ..., "statement_record": ...})`;

    slide6.addText(crewaiCode, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.2,
      fontSize: 9,
      fontFace: "Courier New",
      fill: { color: "f7fafc" },
      color: "2d3748",
      valign: "top"
    });

    // Slide 7: AutoGen Code Example
    const slide7 = pptx.addSlide();
    slide7.addText("AutoGen Implementation", {
      x: 0.5, y: 0.3, w: 9, h: 0.5,
      fontSize: 24, bold: true, color: "1a365d"
    });

    const autogenCode = `from autogen import AssistantAgent, UserProxyAgent, GroupChat

config_list = [{"model": "gpt-4o", "api_key": os.environ["OPENAI_API_KEY"]}]

reconciliation_agent = AssistantAgent(
    name="ReconciliationExpert",
    system_message="""You are an expert in financial reconciliation.
    Analyze record pairs and identify discrepancies.""",
    llm_config={"config_list": config_list}
)

classifier_agent = AssistantAgent(
    name="ExceptionClassifier",
    system_message="""You classify reconciliation exceptions.
    Use codes: E001 (amount mismatch), E002 (date mismatch), etc.""",
    llm_config={"config_list": config_list}
)

user_proxy = UserProxyAgent(
    name="User", human_input_mode="NEVER", code_execution_config=False
)

groupchat = GroupChat(
    agents=[user_proxy, reconciliation_agent, classifier_agent],
    messages=[], max_round=5
)
result = user_proxy.initiate_chat(reconciliation_agent, message=f"Reconcile...")`;

    slide7.addText(autogenCode, {
      x: 0.3, y: 0.9, w: 9.4, h: 4.2,
      fontSize: 9,
      fontFace: "Courier New",
      fill: { color: "f7fafc" },
      color: "2d3748",
      valign: "top"
    });

    // Slide 8: LLM Options
    const slide8 = pptx.addSlide();
    slide8.addText("3. LLM Options Comparison", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: "1a365d"
    });

    const llmRows: TableRow[] = [
      [{ text: "Model", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Provider", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Context", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Strengths", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Best For", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } }],
      [{ text: "GPT-4o" }, { text: "OpenAI" }, { text: "128K" }, { text: "Best reasoning" }, { text: "Complex analysis" }],
      [{ text: "GPT-4o-mini" }, { text: "OpenAI" }, { text: "128K" }, { text: "Cost-effective" }, { text: "High-volume" }],
      [{ text: "Claude 3.5 Sonnet" }, { text: "Anthropic" }, { text: "200K" }, { text: "Follows instructions" }, { text: "Detailed work" }],
      [{ text: "Gemini 2.0 Flash" }, { text: "Google" }, { text: "1M" }, { text: "Fast, cheap" }, { text: "Batch processing" }],
      [{ text: "Llama 3.1 70B" }, { text: "Meta" }, { text: "128K" }, { text: "Open source" }, { text: "Data privacy" }]
    ];

    slide8.addTable(llmRows, {
      x: 0.3, y: 1, w: 9.4,
      fontSize: 10,
      border: { pt: 0.5, color: "cccccc" },
      align: "center",
      valign: "middle"
    });

    // Slide 9: Cost Comparison
    const slide9 = pptx.addSlide();
    slide9.addText("Cost Comparison (Monthly Estimates)", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: "1a365d"
    });

    const costRows: TableRow[] = [
      [{ text: "Tier", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Records/Mo", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "AWS + GPT-4o", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "AWS + Gemini", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "GCP + Gemini", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Azure + GPT-4o", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } }],
      [{ text: "Starter" }, { text: "10,000" }, { text: "$150-250" }, { text: "$80-120" }, { text: "$70-110" }, { text: "$160-260" }],
      [{ text: "Growth" }, { text: "100,000" }, { text: "$800-1,200" }, { text: "$350-500" }, { text: "$320-450" }, { text: "$850-1,250" }],
      [{ text: "Enterprise" }, { text: "1,000,000" }, { text: "$6,000-9,000" }, { text: "$2,500-3,500" }, { text: "$2,200-3,200" }, { text: "$6,500-9,500" }]
    ];

    slide9.addTable(costRows, {
      x: 0.2, y: 1, w: 9.6,
      fontSize: 10,
      border: { pt: 0.5, color: "cccccc" },
      align: "center",
      valign: "middle"
    });

    slide9.addText("LLM API Costs (per 1M tokens):", {
      x: 0.5, y: 3, w: 9, h: 0.4,
      fontSize: 12, bold: true, color: "2d3748"
    });
    slide9.addText("• GPT-4o: $5 input / $15 output\n• GPT-4o-mini: $0.15 input / $0.60 output\n• Claude 3.5 Sonnet: $3 input / $15 output\n• Gemini 2.0 Flash: $0.075 input / $0.30 output", {
      x: 0.5, y: 3.4, w: 9, h: 1.5,
      fontSize: 11, color: "4a5568"
    });

    // Slide 10: Recommendations
    const slide10 = pptx.addSlide();
    slide10.addText("Recommended Stack Combinations", {
      x: 0.5, y: 0.3, w: 9, h: 0.6,
      fontSize: 28, bold: true, color: "1a365d"
    });

    const recRows: TableRow[] = [
      [{ text: "Scenario", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Infrastructure", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Framework", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "LLM", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } },
       { text: "Est. Cost", options: { bold: true, fill: { color: "1a365d" }, color: "ffffff" } }],
      [{ text: "Cost-Optimized" }, { text: "GCP Cloud Run" }, { text: "LangChain" }, { text: "Gemini 2.0 Flash" }, { text: "$70-450" }],
      [{ text: "Performance-First" }, { text: "AWS EKS" }, { text: "LangGraph" }, { text: "GPT-4o" }, { text: "$500-9,000" }],
      [{ text: "Enterprise" }, { text: "Azure AKS" }, { text: "AutoGen" }, { text: "Azure OpenAI" }, { text: "$600-10,000" }],
      [{ text: "Multi-Agent" }, { text: "AWS ECS" }, { text: "CrewAI" }, { text: "Claude 3.5 Sonnet" }, { text: "$400-5,000" }]
    ];

    slide10.addTable(recRows, {
      x: 0.3, y: 1, w: 9.4,
      fontSize: 11,
      border: { pt: 0.5, color: "cccccc" },
      align: "center",
      valign: "middle"
    });

    slide10.addText("Key Takeaways:", {
      x: 0.5, y: 3.2, w: 9, h: 0.4,
      fontSize: 14, bold: true, color: "2d3748"
    });
    slide10.addText("• Start with LangChain + Gemini for fastest time-to-value\n• Move to LangGraph for complex stateful workflows\n• Consider CrewAI for multi-agent collaboration scenarios\n• Use GPT-4o when accuracy is critical over cost", {
      x: 0.5, y: 3.6, w: 9, h: 1.5,
      fontSize: 12, color: "4a5568"
    });

    pptx.writeFile({ fileName: "Agentic_Reconciliation_TechStack.pptx" });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agentic Reconciliation Tech Stack</h1>
          <p className="text-muted-foreground mt-1">Infrastructure, Frameworks & LLM Options</p>
        </div>
        <Button onClick={generatePowerPoint} size="lg" className="gap-2">
          <Download className="h-5 w-5" />
          Download PowerPoint
        </Button>
      </div>

      <Tabs defaultValue="infrastructure" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="infrastructure" className="gap-2">
            <Server className="h-4 w-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2">
            <Bot className="h-4 w-4" />
            Frameworks
          </TabsTrigger>
          <TabsTrigger value="llms" className="gap-2">
            <Brain className="h-4 w-4" />
            LLMs
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Infrastructure Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left">Provider</th>
                      <th className="p-3 text-left">Compute</th>
                      <th className="p-3 text-left">Database</th>
                      <th className="p-3 text-left">Serverless</th>
                      <th className="p-3 text-left">Storage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">AWS</td>
                      <td className="p-3">EC2, ECS, EKS</td>
                      <td className="p-3">RDS PostgreSQL, Aurora</td>
                      <td className="p-3">Lambda</td>
                      <td className="p-3">S3</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">Azure</td>
                      <td className="p-3">App Service, AKS</td>
                      <td className="p-3">Azure SQL, Cosmos DB</td>
                      <td className="p-3">Azure Functions</td>
                      <td className="p-3">Blob Storage</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">GCP</td>
                      <td className="p-3">Cloud Run, GKE</td>
                      <td className="p-3">Cloud SQL, Firestore</td>
                      <td className="p-3">Cloud Functions</td>
                      <td className="p-3">Cloud Storage</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frameworks" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Framework Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left">Framework</th>
                      <th className="p-3 text-left">Best For</th>
                      <th className="p-3 text-left">Learning Curve</th>
                      <th className="p-3 text-left">Key Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">LangChain</td>
                      <td className="p-3">General-purpose chains</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">Modular, extensive integrations</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">LangGraph</td>
                      <td className="p-3">Complex stateful workflows</td>
                      <td className="p-3">Medium-High</td>
                      <td className="p-3">Graph-based, cycles support</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">CrewAI</td>
                      <td className="p-3">Multi-agent collaboration</td>
                      <td className="p-3">Low</td>
                      <td className="p-3">Role-based agents, simple API</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">AutoGen</td>
                      <td className="p-3">Conversational agents</td>
                      <td className="p-3">Medium</td>
                      <td className="p-3">Microsoft-backed, multi-agent chat</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">LangChain Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`from langchain.agents import AgentExecutor
from langchain_openai import ChatOpenAI
from langchain.tools import Tool

def match_records(ledger, statement):
    return "MATCH" or "EXCEPTION_CODE"

tools = [Tool(name="match_records", 
              func=match_records)]

llm = ChatOpenAI(model="gpt-4o")
agent = create_openai_tools_agent(llm, tools)
executor = AgentExecutor(agent=agent, tools=tools)

result = executor.invoke({
    "ledger": ledger_data,
    "statement": statement_data
})`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">LangGraph Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`from langgraph.graph import StateGraph, END

class ReconciliationState(TypedDict):
    records: List[dict]
    results: List[dict]

def analyze_record(state):
    result = llm.invoke(state["records"])
    state["results"].append(result)
    return state

workflow = StateGraph(ReconciliationState)
workflow.add_node("analyze", analyze_record)
workflow.add_conditional_edges(
    "analyze", should_continue
)
app = workflow.compile()
result = app.invoke(initial_state)`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CrewAI Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`from crewai import Agent, Task, Crew

data_analyst = Agent(
    role="Data Analyst",
    goal="Analyze discrepancies",
    llm="gpt-4o"
)

exception_classifier = Agent(
    role="Exception Classifier",
    goal="Categorize exceptions",
    llm="gpt-4o"
)

crew = Crew(
    agents=[data_analyst, exception_classifier],
    tasks=[analysis_task, classify_task]
)
result = crew.kickoff(inputs={...})`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AutoGen Example</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`from autogen import AssistantAgent, GroupChat

reconciliation_agent = AssistantAgent(
    name="ReconciliationExpert",
    system_message="Analyze records...",
    llm_config={"config_list": config}
)

classifier_agent = AssistantAgent(
    name="ExceptionClassifier",
    system_message="Classify exceptions..."
)

groupchat = GroupChat(
    agents=[recon_agent, classifier],
    max_round=5
)
result = user_proxy.initiate_chat(...)`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="llms" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left">Model</th>
                      <th className="p-3 text-left">Provider</th>
                      <th className="p-3 text-left">Context</th>
                      <th className="p-3 text-left">Strengths</th>
                      <th className="p-3 text-left">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">GPT-4o</td>
                      <td className="p-3">OpenAI</td>
                      <td className="p-3">128K</td>
                      <td className="p-3">Best reasoning, multimodal</td>
                      <td className="p-3">Complex analysis</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">GPT-4o-mini</td>
                      <td className="p-3">OpenAI</td>
                      <td className="p-3">128K</td>
                      <td className="p-3">Cost-effective, fast</td>
                      <td className="p-3">High-volume processing</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">Claude 3.5 Sonnet</td>
                      <td className="p-3">Anthropic</td>
                      <td className="p-3">200K</td>
                      <td className="p-3">Follows instructions well</td>
                      <td className="p-3">Detailed explanations</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">Gemini 2.0 Flash</td>
                      <td className="p-3">Google</td>
                      <td className="p-3">1M</td>
                      <td className="p-3">Fast, cost-effective</td>
                      <td className="p-3">Large batch processing</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">Llama 3.1 70B</td>
                      <td className="p-3">Meta</td>
                      <td className="p-3">128K</td>
                      <td className="p-3">Open source, self-hosted</td>
                      <td className="p-3">Data privacy requirements</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Estimates by Usage Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left">Tier</th>
                      <th className="p-3 text-left">Records/Mo</th>
                      <th className="p-3 text-left">AWS + GPT-4o</th>
                      <th className="p-3 text-left">AWS + Gemini</th>
                      <th className="p-3 text-left">GCP + Gemini</th>
                      <th className="p-3 text-left">Azure + GPT-4o</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">Starter</td>
                      <td className="p-3">10,000</td>
                      <td className="p-3">$150-250</td>
                      <td className="p-3">$80-120</td>
                      <td className="p-3">$70-110</td>
                      <td className="p-3">$160-260</td>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-3 font-semibold">Growth</td>
                      <td className="p-3">100,000</td>
                      <td className="p-3">$800-1,200</td>
                      <td className="p-3">$350-500</td>
                      <td className="p-3">$320-450</td>
                      <td className="p-3">$850-1,250</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-semibold">Enterprise</td>
                      <td className="p-3">1,000,000</td>
                      <td className="p-3">$6,000-9,000</td>
                      <td className="p-3">$2,500-3,500</td>
                      <td className="p-3">$2,200-3,200</td>
                      <td className="p-3">$6,500-9,500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LLM API Pricing (per 1M tokens)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">GPT-4o</h4>
                  <p className="text-sm text-muted-foreground">$5 input / $15 output</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">GPT-4o-mini</h4>
                  <p className="text-sm text-muted-foreground">$0.15 input / $0.60 output</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">Claude 3.5 Sonnet</h4>
                  <p className="text-sm text-muted-foreground">$3 input / $15 output</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold">Gemini 2.0 Flash</h4>
                  <p className="text-sm text-muted-foreground">$0.075 input / $0.30 output</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Stack Combinations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary text-primary-foreground">
                      <th className="p-3 text-left">Scenario</th>
                      <th className="p-3 text-left">Infrastructure</th>
                      <th className="p-3 text-left">Framework</th>
                      <th className="p-3 text-left">LLM</th>
                      <th className="p-3 text-left">Est. Monthly Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-green-50 dark:bg-green-950">
                      <td className="p-3 font-semibold">💰 Cost-Optimized</td>
                      <td className="p-3">GCP Cloud Run</td>
                      <td className="p-3">LangChain</td>
                      <td className="p-3">Gemini 2.0 Flash</td>
                      <td className="p-3">$70-450</td>
                    </tr>
                    <tr className="border-b bg-blue-50 dark:bg-blue-950">
                      <td className="p-3 font-semibold">🚀 Performance-First</td>
                      <td className="p-3">AWS EKS</td>
                      <td className="p-3">LangGraph</td>
                      <td className="p-3">GPT-4o</td>
                      <td className="p-3">$500-9,000</td>
                    </tr>
                    <tr className="border-b bg-purple-50 dark:bg-purple-950">
                      <td className="p-3 font-semibold">🏢 Enterprise/Compliance</td>
                      <td className="p-3">Azure AKS</td>
                      <td className="p-3">AutoGen</td>
                      <td className="p-3">Azure OpenAI GPT-4</td>
                      <td className="p-3">$600-10,000</td>
                    </tr>
                    <tr className="border-b bg-orange-50 dark:bg-orange-950">
                      <td className="p-3 font-semibold">🤖 Multi-Agent Complex</td>
                      <td className="p-3">AWS ECS</td>
                      <td className="p-3">CrewAI</td>
                      <td className="p-3">Claude 3.5 Sonnet</td>
                      <td className="p-3">$400-5,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Key Takeaways</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Start with <strong>LangChain + Gemini</strong> for fastest time-to-value</li>
                  <li>• Move to <strong>LangGraph</strong> for complex stateful workflows</li>
                  <li>• Consider <strong>CrewAI</strong> for multi-agent collaboration scenarios</li>
                  <li>• Use <strong>GPT-4o</strong> when accuracy is critical over cost</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechStackPresentation;
