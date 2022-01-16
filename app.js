/*global d3 */

async function draw() {

    //****************************1. Access Data

    const dataset = await d3.csv("./sotu_most_similar.csv", (d) => {
        d3.autoType(d)
        return d
    })

    // console.log("console logging", dataset)

    dataset.sort((a, b) => b.score - a.score)
    dataset.sort((a, b) => a.text - b.text)

    const topics = ["other", "society", "security", "science & tech", "international", "humanity", "economy"]

    //****************************2. Draw Dimensions

    const width = window.innerWidth * 0.9;

    let dimensions = {
        width: width,
        height: width * 0.6,
        margin: {
            top: 80,
            right: 50,
            bottom: 50,
            left: 100
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
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
    // .attr("viewBox", `0 0 ${dimensions.boundedWidth} ${dimensions.boundedHeight}`)

    const bounds = wrapper.append("g")
        .style("translate", `transform(${dimensions.margin.left}px, ${dimensions.margin.top}px)`)

    const tooltip = d3.select("#tooltip")

    const legendtip = d3.select("#legendtip")

    //----------------------- 3(a). Init static elements

    const backdrop = bounds.append('g')
        .attr("class", "backdrop")

    const topicRect = backdrop.append("rect")
        .attr("x", dimensions.boundedWidth - 140)
        .attr("y", dimensions.margin.top - 10)
        .attr("width", 250)
        .attr("height", 170)
        .style("stroke", "darkGreen")
        .style("stroke-opacity", 0)
        .style("stroke-width", 2)
        .style("fill", "none")

    const dotChart = bounds.append("g")
        .attr("class", "score-dot")

    const axesGroup = bounds.append("g")
        .attr("class", "x-axis")
        .style("transform", `translate(50px, ${dimensions.boundedHeight - 50}px)`)
        .append("text")
        .attr("class", "x-axis-label")

    const topicAxisGroup = bounds.append("g")
        // .attr("class", "topic-bar")
        .attr("class", "topic-y-axis")
        .style("transform", `translate(${dimensions.boundedWidth - 30}px, 28px)`)

    const topicGroup = bounds.append("g")
        .attr("class", "topic-bar")

    const topicBox = bounds.append("g")
        .attr("class", "topic-box")

    const topicLabel = bounds.append("g")
        .attr("class", "topic-label")
    // .style("transform", `translate(${dimensions.boundedWidth - 200}px, 28px)`)

    const introLabel = topicLabel.append("text")
        .text("Breakdown of themes related to:")
        .style("transform", `translate(${dimensions.boundedWidth - 155}px, 80px)`)
        .attr("font-size", "14px")
        .attr("font-family", "Zen Kaku Gothic New")
        .attr("font-weight", "700")
        .style("fill", "#004d00")

    const divider = topicLabel.append("rect")
        .attr("x", dimensions.boundedWidth - 160)
        .attr("y", 85)
        .attr("width", 270)
        .attr("height", 0.5)
        .attr("fill", "#004d00")

    const keywordButton = d3.select("#metric")
        // keywordButton.style("transform", `translate(${dimensions.boundedWidth / 2 - 55}px,12px)`)
        .style("display", "block")


    const buttonCall = bounds.append("text")
        .text("Toggle the Dropdown Menu to Find out More:")
        .style("transform", `translateY(5px)`)
        .attr("font-family", "MonumentExtended-Black")
        .attr("font-size", "1.5em")
        .style("fill", "darkGreen")
        .attr("class", "call-to-action")

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
        const metricFormatter = metric[0].toUpperCase() + metric.slice(1)
        const topicRollup = d3.rollup(dataset.filter(d => keywordAccessor(d) === metric), v => v.length, topicAccessor)

        //   console.log(topicRollup)

        const topicValues = [...topicRollup.values()]
        const topicKeys = [...topicRollup.keys()]
        const valueCumSum = d3.cumsum(topicValues)

        let topicPct = [];

        for (let value of topicValues) {
            topicPct.push(value / d3.max(valueCumSum))
        }


        // console.log(topicPct)

        let topicData = [];

        for (let i = 0; i < topicKeys.length; i++) {
            topicData[i] = {
                topic: topicKeys[i],
                count: topicValues[i],
                countCumSum: valueCumSum[i],
                pct: topicPct[i]
            }
        }

        topicData.sort((a, b) => b.topic - a.topic)

        console.log(topicData)

        const rUTopicAccessor = d => d.topic
        const rUcCountAccessor = d => d.count
        const rUcCumSumAccessor = d => d.countCumSum
        const rUcPctAccessor = d => d.pct

        // console.log(rUcCumSumAccessor(topicData[01]))

        //***********************5. Create Scales

        const scoreScale = d3.scaleSqrt()
            .domain(d3.extent(dataset, scoreAccessor))
            .range([4, 30])

        const colorScale = d3.scaleOrdinal()
            .domain(topics)
            .range(["Lavender", "Thistle", "PowderBlue", "LightSalmon", "Moccasin", "LightSteelBlue", "YellowGreen"])

        const xScale = d3.scaleTime()
            .domain(d3.extent(dataset, yearAccessor))
            .range([0, dimensions.boundedWidth - 250])
            .nice()

        const topicXScale = d3.scaleLinear()
            .domain(d3.extent(topicData, rUcPctAccessor))
            .range([0, 100])


        const topicYScale = d3.scaleBand()
            .domain(topics)
            .range([dimensions.boundedHeight / 2 - 100, dimensions.margin.top])
            .padding(0.2)



        //***************************6. Draw Data

        //---------------------------6(a) Draw Text Scores
        let scoreGroup = bounds.select(".score-dot")
            .selectAll(".score-dot")
            .data(dataset.filter(d => keywordAccessor(d) === metric))


        scoreGroup.exit().remove()

        const newScoreGroup = scoreGroup.enter().append("g")
            .attr("class", "score-dot")


        newScoreGroup.append("circle")
        newScoreGroup.append("text")

        scoreGroup = newScoreGroup.merge(scoreGroup)


        const scoreDots = scoreGroup.select("circle")
            .attr("cx", dimensions.boundedWidth / 2)
            .attr("cy", dimensions.boundedHeight / 2)
            .attr("r", d => scoreScale(scoreAccessor(d)))
            .attr("fill", d => colorScale(topicAccessor(d))) //do not use .style() it will override any other event
            .attr("stroke", "lightgrey")
            .style("opacity", 0.6)
            .raise()


        const scoreLabels = scoreGroup.select("text")
            .attr("x", dimensions.boundedWidth / 2)
            .attr("y", dimensions.boundedHeight / 2)
            .text(textAccessor)
            .style("text-anchor", "middle")
            .attr("fill", "black")
            .style("opacity", d => scoreAccessor(d) > 0.28 ? 1 : 0)
            .style("font-size", "12px")
            .style("font-family", "Zen Kaku Gothic New")
            .raise()




        //---------------------------6(c). Draw topic Summary Bars


        let topicsGroup = topicGroup.selectAll(".topic-bar")
            .data(topicData)

        topicsGroup.exit().remove()

        const newTopicsGroup = topicsGroup.enter().append("g")
            .attr("class", "topic-bar")

        newTopicsGroup.append("rect")
        newTopicsGroup.append("text")

        topicsGroup = newTopicsGroup.merge(topicsGroup)

        const topicBars = topicsGroup.selectAll("rect")
            .join("rect")
            .attr("x", dimensions.boundedWidth - 30)
            .attr("y", d => topicYScale(rUTopicAccessor(d)) + 28)
            .attr("width", d => topicXScale(rUcPctAccessor(d)))
            .attr("height", topicYScale.bandwidth())
            .attr("fill", d => colorScale(rUTopicAccessor(d)))


        const pctFormatter = d3.format(".1%")

        const topicLabels = topicsGroup.selectAll("text")
            .join("text")
            .attr("x", d => dimensions.boundedWidth - 15 + topicXScale(rUcPctAccessor(d)))
            .attr("y", d => topicYScale(rUTopicAccessor(d)) + 40)
            .text(d => pctFormatter(rUcPctAccessor(d)))
            .style("text-anchor", "middle")
            .attr("fill", "black")
            .style("font-size", "12px")
            .style("font-family", "Zen Kaku Gothic New")
            .raise()

        //---------------------------6(d). Draw topic Labels


        let topicsLabel = topicLabel.selectAll(".topic-label")
            .data(topicData)

        topicsLabel.exit().remove()

        const newTopicsLabel = topicsLabel.enter().append("g")
            .attr("class", "topic-label")

        newTopicsLabel.append("text")

        topicsLabel = newTopicsLabel.merge(topicsLabel)

        topicsLabel.selectAll("text")
            .join("text")
            .attr("x", dimensions.boundedWidth + 46)
            .attr("y", 80)
            .text(metricFormatter)
            .attr("class", "promise-label")
            .attr("fill", "#004d00")
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "700")
            .style("font-family", "Zen Kaku Gothic New")
            .raise()


        // ------------------------------6(b). Creation Simuation 
        // Features of the forces applied to the nodes:
        const simulation = d3.forceSimulation()
            .force("x", d3.forceX().strength(1).x(d => xScale(yearAccessor(d))))
            // .force("y", d3.forceY().strength(0.0001).y(d => xScale(yearAccessor(d)) % 2 ===0 ? dimensions.boundedHeight/2 - 50 : dimensions.boundedHeight/2 + 50))/
            .force("center", d3.forceCenter().x(dimensions.boundedWidth / 2 - 65).y(dimensions.boundedHeight / 2)) // Attraction to the center of the svg area
            .force("charge", d3.forceManyBody().strength(0.1).distanceMax(0.1).distanceMin(0.01))// 
            //   .force("radial", d3.forceRadial(d => xScale(yearAccessor(d))).strength(0.8))
            .force("collide", d3.forceCollide().strength(0.005).radius(d => scoreScale(scoreAccessor(d))).iterations(1))// Force that avoids circle overlapping
        //
        // Apply these forces to the nodes and update their positions.
        // Once the force algorithm is happy with positions('alpha' value is low enough), simulations will stop.
        simulation
            .nodes(dataset)
            .on("tick", function (d) {
                scoreDots
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)

                scoreLabels
                    .attr("x", d => d.x)
                    .attr("y", d => d.y)

            });


        // invalidation.then(() => simulation.stop());





        //***************************8. Draw Peripherals

        //----------------Draw Xaxis
        const xAxisGenerator = d3.axisBottom().scale(xScale)
            .tickSize(-500)
        const xAxis = bounds.select(".x-axis")
            .call(xAxisGenerator)

        const tickStroke = xAxis.select(".domain").remove()

        const tickLine = xAxis.selectAll(".tick line")
            .attr("stroke", "steelBlue")
            .attr("opacity", 0.2)
            .attr("class", 'year-tick')
            .style("transform", "translateY(-14px)")

        const xTickFont = xAxis.selectAll(".tick text")
            .attr("font-size", "16")
            .attr("font-family", "Zen Kaku Gothic New")
            .attr("class", "tick-font")
            .attr("color", "#4B0082")
            .attr("font-weight", "400")

        const topicYAxisGenerator = d3.axisLeft().scale(topicYScale).tickSizeOuter(0)


        const topicYAxis = bounds.select(".topic-y-axis")
            .call(topicYAxisGenerator)

        const yTickFont = topicYAxis.selectAll(".tick text")
            .attr("font-family", "Zen Kaku Gothic New")
            .attr("font-size", "14")



        //6. Add Interactions


        scoreDots.on("mouseenter", onMouseEnter)
            .on("mouseleave", onMouseLeave)


        function onMouseEnter(event, datum) {
            d3.select(this)
                .attr("fill", (datum.president === "Obama" || datum.president === "Biden") ? "cornflowerblue" : "lightcoral")

            //Fill in tooltip with text

            tooltip.select("#similar")
                .text(metricFormatter)

            tooltip.select("#similar-text")
                .text(datum.text)

            const formatScore = d3.format(".2f")
            tooltip.select("#score")
                .text(formatScore(datum.score))

            console.log(datum)

            //Format tooltip position        


            const x = d3.select(this).attr("cx")
            const y = d3.select(this).attr("cy")

            console.log(x)
            console.log(y)

            tooltip.style("transform", `translate(`
                + `calc(-8% + ${x}px),`
                + `calc(180% + ${y}px)`
                + `)`)


            tooltip.style("opacity", 1)
        }



        function onMouseLeave(event) {
            d3.select(this)
                .attr("fill", d => colorScale(topicAccessor(d)))

            tooltip.style("opacity", 0)
        }


    }

    d3.select("#metric").on('change', function (e) {
        e.preventDefault()

        drawBubble(this.value)
    })


    drawBubble('american')

} draw()





