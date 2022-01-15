/*global d3 */

async function draw() {

    //****************************1. Access Data

    const dataset = await d3.csv("./sotu_most_similar.csv", (d) => {
        d3.autoType(d) 
        return d
    })
    
    console.log("console logging",dataset)

    dataset.sort((a, b) => b.score - a.score)
    dataset.sort((a, b) => a.text - b.text)
    
    const topics = ["other","society","security","science & tech","international","humanity", "economy"]
    
    //****************************2. Draw Dimensions

    const width = 1000;
    
    let dimensions = {
        width: width,
        height: width * 0.8,
        margin: {
            top: 80,
            right: 50,
            bottom: 50,
            left: 50
        }
    }

    dimensions.boundedWidth = dimensions.width
        - dimensions.margin.left
        - dimensions.margin.right

    dimensions.boundedHeight = dimensions.height
        - dimensions.margin.top
        - dimensions.margin.bottom

    //*************************3. Draw Canvas 

    const wrapper = d3.select("#wrapper")
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)

    const bounds = wrapper.append("g")
        .style("translate",`transform(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)
        
    const tooltip = d3.select("#tooltip")
    
    const legendtip = d3.select("#legendtip")
 
    //----------------------- 3(a). Init static elements
    
    bounds.append("g")
        .attr("class","score-dot")
    bounds.append("g")
        .attr("class","x-axis")
        .style("transform", `translate(50px, ${dimensions.boundedHeight-50}px)`)
        .append("text")
        .attr("class", "x-axis-label")
    bounds.append("g")
        .attr("class","topic-bar")
        .attr("class","topic-y-axis")
        .style("transform", `translateX(${dimensions.boundedWidth-110}px)`)

   //***********************4. Create filterable charts
    
    const drawBubble = metric => {
        
    //----------------------4(a). Create Accessors 
    const presidentAccessor = d => d.president
    const keywordAccessor = d => d.keyword
    const textAccessor = d => d.text
    const scoreAccessor = d => d.score
    const topicAccessor = d => d.topic
    const yearParser = d3.timeParse("%Y")
    const yearAccessor = d => yearParser(d.year)
   
    
    
    // console.log(presidentAccessor(dataset[0]))
    // console.log(keywordAccessor(dataset[0]))
    // console.log(textAccessor(dataset[0]))
    // console.log(scoreAccessor(dataset[0]))
    // console.log(topicAccessor(dataset[0]))
    // console.log(yearAccessor(dataset[0]))
    
    //-------------------4(b). Create 
    
  const topicRollup = d3.rollup(dataset.filter(d => keywordAccessor(d) === metric), v=> v.length, topicAccessor)
  
    //   console.log(topicRollup)
     
     const topicValues = [...topicRollup.values()]
     const topicKeys =[...topicRollup.keys()]
     const valueCumSum = d3.cumsum(topicValues)
     
let topicPct = [];

for (let value of topicValues) {
    topicPct.push(value/d3.max(valueCumSum))
}
 
 
// console.log(topicPct)
     
let topicData = [];
 
    for (let i=0; i<topicKeys.length; i++) {
        topicData[i] = {
            topic: topicKeys[i],
            count: topicValues[i],
            countCumSum: valueCumSum[i],
            pct: topicPct[i]
        }
    }
    
 topicData.sort((a,b) => b.topic - a.topic)
     
// console.log(topicData[0])

    const rUTopicAccessor = d => d.topic
    const rUCountAccessor = d => d.count
    const rUcCumSumAccessor = d => d.countCumSum

// console.log(rUcCumSumAccessor(topicData[01]))

    //***********************5. Create Scales
    
    const scoreScale = d3.scaleSqrt()
        .domain(d3.extent(dataset,scoreAccessor))
        .range([2,40])
    
    const colorScale = d3.scaleOrdinal()
        .domain(topics)
        .range(["Lavender","Thistle","PowderBlue","LightSalmon","Moccasin","LightSteelBlue","YellowGreen"])
    const xScale = d3.scaleTime()
        .domain(d3.extent(dataset,yearAccessor))
        .range([0,dimensions.boundedWidth])
        .nice()
        
    const topicXScale = d3.scaleLinear()  
        .domain(d3.extent(topicData,rUCountAccessor))
        .range([0, 100])
        
    
    const topicYScale = d3.scaleBand()  
        .domain(topics)
        .range([dimensions.boundedHeight/2-200, dimensions.margin.top])
        .padding(0.2)

 
    
    //***************************6. Draw Data
    
    //---------------------------6(a) Draw Text Scores
    
    let scoreGroup = bounds.select(".score-dot")
        .selectAll(".score-dot")
        .data(dataset.filter(d => keywordAccessor(d) === metric))
        
        
     scoreGroup.exit().remove()  
    
    const newScoreGroup = scoreGroup.enter().append("g")
            .attr("class","score-dot")
            
         
    newScoreGroup.append("circle")
    newScoreGroup.append("text")   
    
    scoreGroup = newScoreGroup.merge(scoreGroup)


    const scoreDots = scoreGroup.select("circle")
        .attr("cx", dimensions.boundedWidth/2)
        .attr("cy", dimensions.boundedHeight/2 )
        .attr("r", d => scoreScale(scoreAccessor(d)))
        .attr("fill", d => colorScale(topicAccessor(d))) //do not use .style() it will override any other event
        .attr("stroke","lightgrey")
        .style("opacity", 0.6)
        .raise()
        
     
  const scoreLabels = scoreGroup.select("text")
        .attr("x", dimensions.boundedWidth/2)
        .attr("y", dimensions.boundedHeight/2 )
        .text(textAccessor)
        .style("text-anchor", "middle")
      .attr("fill", "black")
      .style("opacity", d => scoreAccessor(d) > 0.28? 1: 0)
      .style("font-size", "12px")
      .style("font-family", "Zen Kaku Gothic New")
      .raise()
  
      
// ------------------------------6(b). Creation Simuation 
// Features of the forces applied to the nodes:
  const simulation = d3.forceSimulation()
        .force("x", d3.forceX().strength(1).x(d => xScale(yearAccessor(d))))
        // .force("y", d3.forceY().strength(0.0001).y(d => xScale(yearAccessor(d)) % 2 ===0 ? dimensions.boundedHeight/2 - 50 : dimensions.boundedHeight/2 + 50))/
      .force("center", d3.forceCenter().x(dimensions.boundedWidth/2+60).y(dimensions.boundedHeight/2+100)) // Attraction to the center of the svg area
      .force("charge", d3.forceManyBody().strength(0.1).distanceMax(0.1).distanceMin(0.01))// 
    //   .force("radial", d3.forceRadial(d => xScale(yearAccessor(d))).strength(0.8))
      .force("collide", d3.forceCollide().strength(0.005).radius(d => scoreScale(scoreAccessor(d))).iterations(1))// Force that avoids circle overlapping
//
  // Apply these forces to the nodes and update their positions.
  // Once the force algorithm is happy with positions ('alpha' value is low enough), simulations will stop.
  simulation
      .nodes(dataset)
      .on("tick", function(d){
           scoreDots
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)  
          
            scoreLabels
        .attr("x", d => d.x)
            .attr("y", d => d.y)
    
      });

      
//   invalidation.then(() => simulation.stop());
      
//---------------------------6(c). Draw topic Summary Bars




const topicGroup = bounds.append("g")

 topicGroup.selectAll("rect")

        .data(topicData)
        .join("rect")
        .attr("class", "topic-bar")
        .attr("x", dimensions.boundedWidth-100)
        .attr("y",  d => topicYScale(rUTopicAccessor(d)))
        .attr("width", d => topicXScale(rUCountAccessor(d)))
        .attr("height", topicYScale.bandwidth())
        .attr("fill", d => colorScale(rUTopicAccessor(d)))
    
    
      
//***************************8. Draw Peripherals

//----------------Draw Xaxis
const xAxisGenerator=d3.axisBottom().scale(xScale)
    .tickSize(-500)
const xAxis = bounds.select(".x-axis")
        .call(xAxisGenerator)
        
const tickStroke = xAxis.select(".domain").remove()

const tickLine = xAxis.selectAll(".tick line")
     .attr("stroke","steelBlue")
     .attr("opacity", 0.2)
     
const xTickFont = xAxis.selectAll(".tick text")
     .attr("font-size","16")
     .attr("font-family","Zen Kaku Gothic New")
     .attr("class","tick-font")
     .attr("color","#4B0082")
        
const topicYAxisGenerator=d3.axisLeft().scale(topicYScale).tickSizeOuter(0)


const topicYAxis = bounds.select(".topic-y-axis")
        .call(topicYAxisGenerator)

const yTickFont = topicYAxis.selectAll(".tick text")
.attr("font-family","Zen Kaku Gothic New")
.attr("font-size","14")
       
      

    


//6. Add Interactions


const keywordButton = d3.select("#metric")
    keywordButton.style("transform", `translate(${dimensions.boundedWidth/2}px,100px)`)
    .style("display", "block")
    
const buttonCall = bounds.append("text")
    .text("Toggle the Dropdown Menu to Find out More:")
    .style("transform", `translate(${dimensions.boundedWidth/2-200}px,30px)`)
    .attr("font-family","MonumentExtended-Black")
    .attr("font-size","1.8em")
    .style("fill","darkGreen")
    

scoreDots.on("mouseenter", onMouseEnter)
.on("mouseleave", onMouseLeave)

function onMouseEnter(event, datum){
   d3.select(this)
    .attr("fill", (datum.president === "Obama" || datum.president === "Biden") ? "cornflowerblue" : "lightcoral")

//Fill in tooltip with text

    tooltip.select("#similar")
            .text(metric)
            
    tooltip.select("#similar-text")
            .text(datum.text)        
            
    const formatScore = d3.format(".2f")
    tooltip.select("#score")
            .text(formatScore(datum.score))
            
//Format tooltip position        


    const x =  d3.select(this).attr("cx")
    const y =  d3.select(this).attr("cy")
    
    console.log(x)
    console.log(y)
    
       tooltip.style("transform", `translate(`
      + `calc( -48% + ${x}px),`
      + `calc(+50% + ${y}px)`
      + `)`)
           
    
    tooltip.style("opacity", 1)
      }



function onMouseLeave(event) {
 d3.select(this)
     .attr("fill", d => colorScale(topicAccessor(d))) 

  tooltip.style("opacity", 0)
}


}

d3.select("#metric").on('change', function(e) {
    e.preventDefault()
    
   drawBubble(this.value)
})

   
drawBubble('america')

} draw()





