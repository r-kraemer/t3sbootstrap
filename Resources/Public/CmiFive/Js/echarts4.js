// function: Wer hat welche H5P-Interaktionen mit welchem Erfolg bearbeitet?

//var xc = new ADL.Collection();

function echarts4_(event, container, page, echartQuery) {
  let data = getStatementsAnswered("answered", page, echartQuery);
  if (typeof data !== "undefined" && data.length > 0)
    echartSetup(container, data, echartQuery);
  else {
    userAlerts("nodatamodal");
    return;
  }
}

// function: get success of answered statements
function getStatementsAnswered(verb, page, echartQuery) {
  let stmtsQ = sessionStorage.getItem("statements"),
    since = "",
    until = "",
    stmtsQ_,
    qStored,
    data = [];
  // check if previuos data of echarts4 in sessiostorage and get data if applicable
  if (stmtsQ && stmtsQ.length > 0) {
    stmtsQ = JSON.parse(stmtsQ);
    for (let i = 0; i < stmtsQ.length; i++) {
      if (Object.keys(stmtsQ[i]).includes(echartQuery)) stmtsQ_ = stmtsQ[i];
    }
    if (stmtsQ_) {
      until = new Date();
      let l = stmtsQ_[echartQuery].length - 1;
      since = stmtsQ_[echartQuery][l]["timestamp"];
      stmtsQ_ = stmtsQ_[echartQuery];
      qStored = true;
    }
  } else stmtsQ = [];
  // query relevant statements in LRS and get selection
  let selection = bm.getStatementsBase(
    verb,
    "", //agent
    "", //registration
    "", //sessionid
    since,
    until,
    true, //relatedactivities
    true, //relatedagents
    "ids", //format
    "", //activity
    "", //page
    true, //more
    cmi5Controller.activityId, //extensionsActivityId
    echartQuery //query
  );
  //xc.append(selection);
  //console.log(xc);
  //console.log(xc.where('verb.id = "http://adlnet.gov/expapi/verbs/answered"'));
  //console.log(xc.groupBy("object.id"));
  // push relevant information of selected statements to data object

  for (let i = 0; i < selection.length; i++) {
    if (
      typeof selection[i].actor.account !== "undefined" &&
      typeof selection[i].result.score !== "undefined"
    ) {
      data.push({
        ["name"]: selection[i].actor.account.name,
        ["object"]: selection[i].object.id,
        ["timestamp"]: selection[i].stored,
        ["duration"]: selection[i].result.duration,
        ["scaled"]: selection[i].result.score.scaled,
        ["success"]: selection[i].result.success
      });
    }
  }
  // push previuos data in sessiostorage of echarts4 to data object if applicable
  if (qStored) data.push(...stmtsQ_);
  // sort data by timestamp
  data.sort(
    (b, a) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  // assign sorted data to cmi5Controller[echarts4] object
  if (data.length > 0) {
    if (stmtsQ.length > 0) {
      for (let i = 0; i < stmtsQ.length; i++) {
        if (Object.keys(stmtsQ[i]).includes(echartQuery))
          stmtsQ[i] = { [echartQuery]: data };
      }
    } else stmtsQ.push({ [echartQuery]: data });
    // update data in sessionstorage
    sessionStorage.setItem("statements", JSON.stringify(stmtsQ));
  }
  return data;
}

// function: draw echart
function echartSetup(container, data_, echartQuery) {
  /*
    ["name"]: selection[i].actor.account.name,
    ["object"]: selection[i].object.id,
    ["timestamp"]: selection[i].stored,
    ["duration"]: selection[i].result.duration,
    ["scaled"]: selection[i].result.score.scaled,
    ["success"]: selection[i].result.success
  */
  if (document.getElementById(container))
    container = document.getElementById(container);
  if (sessionStorage.getItem("cmi5No") == "false") {
    let myChart = echarts.init(container),
      option,
      dmin = data_[0]["timestamp"],
      dn = [],
      series = [],
      pieData = [],
      day = new Date(dmin),
      color,
      users = [],
      freqUsers = getFrequencyOf(data_, "name"),
      freqObjects = getFrequencyOf(data_, "object"),
      freqSuccess = getFrequencyOf(data_, "success"),
      numberOfDays;
    //dn[0] = subAddDays(day, day.getDay(), -1);
    //numberOfDays = getNumberOfDays(dn[0], dmax) + 1;

    /*for (let i = 0; i < numberOfDays; i++) {
        if (i > 0) dn[i] = subAddDays(dn[i - 1]);
      }*/
    let objects = [];
    var rcolor_;
    for (let i = 0, scaled, dur; i < Object.keys(freqUsers).length; i++) {
      users[i] = "User " + (i + 1);
      scaled = [];
      dur = [];
      for (let k = 0, c, d, o; k < Object.keys(freqObjects).length; k++) {
        o = Object.keys(freqObjects)[k];
        objects[k] = o.substring(
          o.indexOf("h5pcid_"),
          o.indexOf("/", o.indexOf("h5pcid_"))
        );
        dur[k] = 0;
        scaled[k] = 0;
        c = 0;
        d = 0;
        for (let j = 0; j < data_.length; j++) {
          if (
            Object.keys(freqObjects)[k] === data_[j]["object"] &&
            Object.keys(freqUsers)[i] === data_[j]["name"]
          ) {
            c++;
            scaled[k] += Number(data_[j]["scaled"]);
          }
          if (
            Object.keys(freqObjects)[k] === data_[j]["object"] &&
            typeof data_[j]["duration"] !== "undefined" &&
            Object.keys(freqUsers)[i] === data_[j]["name"]
          ) {
            d++;
            dur[k] += moment.duration(data_[j]["duration"]).as("minutes");
          }
        }
        scaled[k] = scaled[k] / c;
        dur[k] = dur[k] / d;
        dur[k] = dur[k].toFixed(1);
      }
      rcolor_ = rcolor();
      series.push({
        name: users[i],
        type: "bar",
        emphasis: {
          focus: "series"
        },
        itemStyle: {
          //borderWidth: 2,
          //borderColor: "white",
          //borderType: 'solid'
          color: rcolor_
        },
        //stack: Object.keys(freqUsers)[j],
        //barWidth: "33%",
        data: scaled
      });
      series.push({
        name: users[i] + " d",
        type: "bar",
        emphasis: {
          focus: "series"
        },
        itemStyle: {
          borderWidth: 1,
          borderColor: "white",
          borderType: "solid",
          color: rcolor_ + "66"
        },
        //stack: Object.keys(freqUsers)[j],
        barGap: 0,
        barWidth: "5%",
        data: dur
      });
    }
    /*for (let i = 0; i < numberOfDays; i++) {
        if (i > 0) dn[i] = subAddDays(dn[i - 1]);
        for (let j = 0; j < data_.length; j++) {
          if (getNumberOfDays(dn[0], data_[j]["timestamp"]) === i) {
            for (let k = 0; k < Object.keys(freqObjects).length; k++) {
              if (data_[j]["success"] === false) color = "#E74E54";
              else color = "#80C462";
              if (
                Object.keys(freqObjects)[k] === data_[j]["object"] &&
                Object.keys(freqUsers)[1] === data_[j]["name"]
              ) {
                for (let u = 0; u < Object.keys(freqUsers).length; u++) {
                  if (Object.keys(freqUsers)[u] === data_[j]["name"]) {
                    user = "User " + (u + 1);
                  }
                }
                series[k].data.push({
                  value: [i, 1],
                  name: user,
                  itemStyle: {
                    color: color
                  }
                });
                series[k].stack = data_[j]["object"];
              }
            }
          }
        }
      }*/
    for (let i = 0; i < Object.keys(freqSuccess).length; i++) {
      if (Object.keys(freqSuccess)[i] === "false") color = "#E74E54";
      else color = "#80C462";
      pieData.push({
        value: Object.values(freqSuccess)[i],
        name: Object.keys(freqSuccess)[i],
        itemStyle: {
          color: color
        }
      });
    }

    series.push({
      name: "Objects",
      type: "pie",
      radius: [0, 70],
      center: ["87%", "27%"],
      itemStyle: {
        borderRadius: 5
      },
      label: {
        show: true
      },
      emphasis: {
        label: {
          show: true
        }
      },
      data: pieData
    });

    /*for (let i = 0, m; i < numberOfDays; i++) {
        m = dn[i].getMonth() + 1;
        dn[i] =
          dn[i].getDate().toString().padStart(2, "0") +
          "." +
          m.toString().padStart(2, "0") +
          "." +
          dn[i].getFullYear();
      }*/

    option = {
      title: {
        text: "Wer hat welche H5P-Interaktionen mit welchem Erfolg bearbeitet?",
        left: ""
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            yAxisIndex: "false"
          },
          dataView: {
            readOnly: false
          },
          magicType: {
            type: ["bar", "stack"]
          },
          restore: {},
          saveAsImage: {}
        }
      },
      dataZoom: [
        {
          type: "slider",
          xAxisIndex: 0,
          filterMode: "none"
        },
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "none"
        }
      ],
      legend: {
        orient: "vertical",
        left: "75%",
        top: "48%",
        type: "scroll"
      },
      tooltip: {
        //trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      grid: {
        left: "3%",
        right: "27%",
        bottom: "3%",
        top: "12%",
        containLabel: true
      },
      xAxis: [
        {
          type: "category",
          data: objects,
          //minInterval: 1,
          axisTick: {
            alignWithLabel: true
          }
          /*splitArea: {
              interval: 0,
              show: true,
              areaStyle: {
                color: [
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.05)",
                  "rgba(0,0,0,0.05)"
                ]
              }
            }*/
        }
      ],
      yAxis: [
        {
          type: "value",
          minInterval: ""
        }
      ],
      series: series
    };
    if (option && typeof option === "object") {
      myChart.setOption(option);
    }
    document.querySelector(".spinner-border").style.display = "none";
    setTimeout(() => {
      let resizeEvent = new Event("resize");
      window.dispatchEvent(resizeEvent);
    }, 0);
    window.addEventListener("resize", myChart.resize);

    var zoomSize = 5,
      click = true,
      sv,
      ev;
    myChart.on("dblclick", function (params) {
      xMouseDown = true;
      for (let k = 0, s, o; k < Object.keys(freqObjects).length; k++) {
        o = Object.keys(freqObjects)[k];
        if (o.includes(params.name) && o.includes("objectid/")) {
          s =
            "https://" +
            o.substring(
              o.indexOf("objectid/") + "objectid/".length,
              o.indexOf("/h5pcid_", o.indexOf("objectid/"))
            );
          location.href =
            s +
            "?" +
            sessionStorage.getItem("cmi5Parms") +
            "#h5p-iframe-" +
            o.substring(
              o.indexOf("h5pcid_") + "h5pcid_".length,
              o.indexOf("/", o.indexOf("h5pcid_"))
            );
        }
      }
    });
    myChart.on("click", function (params) {
      if (params.componentSubType === "bar") {
        if (click) {
          click = false;
          sv = params.value - zoomSize / 2;
          ev = params.value + zoomSize / 2;
        } else {
          click = true;
          ev = 1000;
          sv = 0;
        }
        myChart.dispatchAction({
          type: "dataZoom",
          startValue: sv,
          endValue: ev
        });
      }
    });
  }
}

function rcolor() {
  let maxVal = 0xffffff; // 16777215
  let randomNumber = Math.random() * maxVal;
  randomNumber = Math.floor(randomNumber);
  randomNumber = randomNumber.toString(16);
  let randColor = randomNumber.padStart(6, 0);
  return "#" + randColor.toUpperCase();
}
