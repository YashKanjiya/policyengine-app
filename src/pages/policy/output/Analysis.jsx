import { useSearchParams } from "react-router-dom";
import { Configuration, OpenAIApi } from "openai";
import { useState } from "react";
import Spinner from "../../../layout/Spinner";
import Button from "../../../controls/Button";
import { PythonCodeBlock } from "./PolicyReproducibility";
import colors from "../../../style/colors";
import { getParameterAtInstant } from "../../../api/parameters";
import { BlogPostMarkdown } from "../../BlogPage";
import ReactMarkdown from "react-markdown";


export default function Analysis(props) {
  const { impact, policyLabel, metadata, policy, region, timePeriod } = props;
  const [searchParams] = useSearchParams();
  const selectedVersion = searchParams.get("version") || metadata.version;
  const relevantParameters = Object.keys(policy.reform.data).map(parameter => metadata.parameters[parameter]);
  const relevantParameterBaselineValues = relevantParameters.map(parameter => {return {[parameter.parameter]: getParameterAtInstant(parameter, `${timePeriod}-01-01`)}});
  // metadata.economy_options.region = [{name: "uk", label: "United Kingdom"}]
  const regionKeyToLabel = metadata.economy_options.region.reduce((acc, { name, label }) => {
    acc[name] = label;
    return acc;
  }, {});
  const baseResultsUrl = `https://policyengine.org/${metadata.countryId}/policy?version=${selectedVersion}&region=${region}&timePeriod=${timePeriod}&reform=${policy.reform.id}&baseline=${policy.baseline.id}&embed=True`;
  console.log(baseResultsUrl)
  const policyDetails = `I'm using PolicyEngine, a free, open source tool to compute the impact of public policy. I'm writing up an economic analysis of a hypothetical tax-benefit policy reform. Please write the analysis for me using the details below, in their order. You should:
  
  * First explain each provision of the reform, noting that it represents policy reforms for ${timePeriod} and ${regionKeyToLabel[region]}. Explain how the parameters are changing from the baseline to the reform values using the given data.
  * Round large numbers like: ${metadata.currency}3.1 billion, ${metadata.currency}300 million, ${metadata.currency}106,000, ${metadata.currency}1.50 (never ${metadata.currency}1.5).
  * Round percentages to one decimal place.
  * Avoid normative language like 'requires', 'should', 'must', and use quantitative statements over general adjectives and adverbs. If you don't know what something is, don't make it up.
  * Avoid speculating about the intent of the policy or inferring any motives; only describe the observable effects and impacts of the policy. Refrain from using subjective language or making assumptions about the recipients and their needs.
  * Use the active voice where possible; for example, write phrases where the reform is the subject, such as "the reform [or a description of the reform] reduces poverty by x%".
  * Use ${metadata.countryId === "uk" ? "British" : "American"} English spelling and grammar.
  * Cite PolicyEngine ${metadata.countryId.toUpperCase()} v${selectedVersion} and the ${metadata.countryId === "uk" ? "PolicyEngine-enhanced 2019 Family Resources Survey" : "2021 Current Population Survey March Supplement"} microdata when describing policy impacts.
  * When describing poverty impacts, note that the poverty measure reported is ${metadata.countryId === "uk" ? "absolute poverty before housing costs" : "the Supplemental Poverty Measure"}.
  * Don't use headers, but do use Markdown formatting (e.g. * for bullets).
  * Include the following embeds inline, without a header so it flows.
  * Immediately after you describe the budgetary impact, include an IFrame pointing to the chart. It should look like this: <iframe src="${baseResultsUrl}&focus=policyOutput.netIncome" width="100%" height="400" style="border: none; overflow: hidden;" onload="scroll(0,0);"></iframe>
  * Immediately after you describe the changes by income decile, include an IFrame: <iframe src="${baseResultsUrl}&focus=policyOutput.decileRelativeImpact" width="100%" height="400" style="border: none; overflow: hidden;" onload="scroll(0,0);"></iframe>
  * Immediately after you describe the changes by poverty status, include an IFrame: <iframe src="${baseResultsUrl}&focus=policyOutput.povertyImpact" width="100%" height="400" style="border: none; overflow: hidden;" onload="scroll(0,0);"></iframe>

  This JSON snippet describes the default parameter values: ${JSON.stringify(relevantParameterBaselineValues)}\n
  This JSON snippet describes the baseline and reform policies being compared: ${JSON.stringify(policy)}\n`;
  const description = `${policyLabel} has the following impacts from the PolicyEngine microsimulation model: 

  This JSON snippet describes the relevant parameters with more details: ${JSON.stringify(relevantParameters)}

  This JSON describes the total budgetary impact, the change to tax revenues and benefit spending (ignore 'households' and 'baseline_net_income': ${JSON.stringify(impact.budget)}

  This JSON describes how common different outcomes were at each income decile: ${JSON.stringify(impact.intra_decile)}

  This JSON describes the average and relative changes to income by each income decile: ${JSON.stringify(impact.decile)}

  This JSON describes the baseline and reform poverty rates by age group (describe the relative changes): ${JSON.stringify(impact.poverty.poverty)}

  This JSON describes the baseline and reform deep poverty rates by age group (describe the relative changes): ${JSON.stringify(impact.poverty.deep_poverty)}

  This JSON describes the baseline and reform poverty and deep poverty rates by gender (briefly describe the relative changes): ${JSON.stringify(impact.poverty_by_gender)}

  This JSON describes three inequality metrics in the baseline and reform, the Gini coefficient of income inequality, the share of income held by the top 10% of households and the share held by the top 1% (describe the relative changes): ${JSON.stringify(impact.inequality)}
  
  `;

  const [audience, setAudience] = useState("Normal");

  const audienceDescriptions = {
    ELI5: "Write this for a five-year-old who doesn't know anything about economics or policy. Explain fundamental concepts like taxes, poverty rates, and inequality as needed.",
    Normal: "Write this for a policy analyst who knows a bit about economics and policy.",
    Wonk: "Write this for a policy analyst who knows a lot about economics and policy. Use acronyms and jargon if it makes the content more concise and informative.",
  };

  const prompt = policyDetails + description + audienceDescriptions[audience];

  const [analysis, setAnalysis] = useState(`
  This analysis examines the economic impact of a hypothetical tax-benefit policy reform for the UK in 2023. The reform involves restoring the £20/week Universal Credit (UC) uplift for various groups. Using PolicyEngine UK v0.44.2 and the PolicyEngine-enhanced 2019 Family Resources Survey microdata, we can assess the impacts of this reform on budgetary costs, income distribution, poverty, and inequality. The reform increases the standard allowance for couples where one is over 25 from £525.72 to £612 per month, and for couples where both are under 25 from £416.45 to £503 per month. Similarly, it increases the standard allowance for single claimants over 25 from £334.91 to £421 per month and for single claimants under 25 from £265.31 to £352 per month. The total budgetary impact of this reform is an increase in benefit spending of £3.1 billion, with no change in tax revenues. The budgetary impact can be visualised through the following chart: <iframe src="http://localhost:3000/uk/policy?version=0.44.2&region=uk&timePeriod=2023&reform=6668&baseline=1&embed=True&focus=policyOutput.netIncome" width="100%" height="400" style="border: none; overflow: hidden;" onload="scroll(0,0);"></iframe> The policy affects households differently depending on their income decile. For instance, 18.4% of the lowest-income decile experiences gains of more than 5%, while only 0.6% of the highest-income decile has similar gains. The following chart illustrates these changes by income decile: <iframe src="http://localhost:3000/uk/policy?version=0.44.2&region=uk&timePeriod=2023&reform=6668&baseline=1&embed=True&focus=policyOutput.decileRelativeImpact" width="100%" height="400" style="border: none; overflow: hidden;" onload="scroll(0,0);"></iframe> In terms of the poverty impacts of this reform, we report the absolute poverty rates before housing costs. The policy leads to a 0.7 percentage point reduction in poverty rates for all individuals (from 16.5% to 15.8%). Similarly, poverty rates for children decrease by 0.9 percentage points (from 24.1% to 23.2%), while poverty rates for adults decrease by 0.8 percentage points (from 14.7% to 13.9%). The poverty rates for seniors decrease by a smaller margin of 0.1 percentage points (from 13.8% to 13.7%). The reform also leads to a decrease in deep poverty rates. Deep poverty rates for children decrease by 0.2 percentage points (from 2.6% to 2.4%), while adult deep poverty rates decrease by 0.2 percentage points (from 2.3% to 2.1%). No change is observed in the deep poverty rates for seniors. The relative changes in deep poverty rates by gender are a decrease of 0.1 percentage points for females (from 1.8% to 1.7%) and for males (from 2.1% to 2.0%). In terms of poverty rates, relative changes indicate a decrease of 0.1 percentage points for both females (from 17.0% to 16.3%) and males (from 15.9% to 15.3%). Lastly, the reform has a relatively small impact on income inequality. The Gini coefficient of income inequality decreases slightly from 32.3% to 32.1%. The top 10% of households' share of income slightly declines from 25.1% to 25.0%, while the top 1% of households' share slightly falls from 6.2% to 6.1%. To summarise, the reform analysed herein results in an increase in benefit spending of £3.1 billion and has positive effects on poverty reduction, particularly for lower-income households, children, and adults. It also leads to a small decrease in income inequality.
  `);
  const [loading, setLoading] = useState(false);
  const [hasClickedGenerate, setHasClickedGenerate] = useState(false);

  const configuration = new Configuration({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const [showPrompt, setShowPrompt] = useState(false);
  const lines = prompt.split("\n");

  const handleAudienceChange = (audienceValue) => {
    setAudience(audienceValue);
  };


  const buttonWidth = "80px";
  const activeColor = colors.DARK_GRAY;

  const inactiveColor = "white";
  const borderColor = "1px solid #6c757d";

  function AudienceButton({ audienceValue, currentAudience, handleAudienceChange }) {
    return (
      <button
        style={{
          backgroundColor: audienceValue === currentAudience ? activeColor : inactiveColor,
          color: audienceValue === currentAudience ? inactiveColor : activeColor,
          borderRadius: audienceValue === "ELI5" ? "5px 0 0 5px" : audienceValue === "Wonk" ? "0 5px 5px 0" : 0,
          border: borderColor,
          borderRight: audienceValue !== "Wonk" ? "none" : borderColor,
          padding: "5px 10px",
          margin: 0,
          cursor: "pointer",
          width: buttonWidth,
        }}
        onClick={() => handleAudienceChange(audienceValue)}
      >
        {audienceValue}
      </button>
    );
  }



  const onGenerate = () => {
    setHasClickedGenerate(true);
    setLoading(true);
    openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    }).then((response) => {
      console.log(response);
      setAnalysis(response.data.choices[0].message.content);
      setLoading(false);
    });
  };

  // Separate analysis into <p> tags
  const analysisContent = analysis.split("\n").map((line, i) => {
    return <p key={i}>{line}</p>;
  });
  const buttonText =
    !hasClickedGenerate ?
      "Generate an analysis" :
      loading ?
        <>
          <Spinner style={{ marginRight: 10 }} />Generating
        </> :
        "Regenerate analysis";
  analysisContent;
  BlogPostMarkdown;
  ReactMarkdown;

  return (
    <>
      <h2>Analysis</h2>
      <p>
        <a href="https://policyengine.org/uk/blog/2023-03-17-automate-policy-analysis-with-policy-engines-new-chatgpt-integration">
          Read more about PolicyEngine&apos;s automatic GPT4-powered policy analysis.
        </a>
        {" "} Generation usually takes around 60 seconds. Please verify any results of this experimental feature against our charts.
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <AudienceButton
            audienceValue="ELI5"
            currentAudience={audience}
            handleAudienceChange={handleAudienceChange}
          />
          <AudienceButton
            audienceValue="Normal"
            currentAudience={audience}
            handleAudienceChange={handleAudienceChange}
          />
          <AudienceButton
            audienceValue="Wonk"
            currentAudience={audience}
            handleAudienceChange={handleAudienceChange}
          />
        </div>
        <Button primary text={buttonText} onClick={onGenerate} style={{ maxWidth: 250, marginBottom: 25 }} />
        {
          !hasClickedGenerate ?
          <BlogPostMarkdown markdown={analysis} /> :
            loading ?
              null :
              <BlogPostMarkdown markdown={analysis} />
        }
      </div>
      <>{analysis}</>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}>
        <Button text={
          showPrompt ?
            "Hide prompt" :
            "Show prompt"
        } onClick={
          () => setShowPrompt(!showPrompt)
        } style={{ maxWidth: 250 }} />
      </div>
      {
        showPrompt ?
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 30,
                marginBottom: 30,
              }}
            >
              <Button
                text="Copy"
                style={{ width: 100 }}
                onClick={() => {
                  navigator.clipboard.writeText(lines.join("\n"));
                }}
              />
            </div>
            <p>
              <PythonCodeBlock lines={lines} />
            </p>
          </> :
          null
      }

    </>
  );
}
