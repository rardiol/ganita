import js
from pyodide.ffi import to_js

from anita.anita_pt_fo import check_proof, ParserAnita
 

def my_check_proof(inp):
    if inp == "start":
        return to_js("start")
    textResponse = check_proof(inp, None, True, True, False)
    try:
        getProofResponse = ParserAnita.getProof(inp)
        print(6, getProofResponse)
        getProofResponse = {
            'latex': getProofResponse.latex,
#           'errors': getProofResponse.errors,
#           'premisses': getProofResponse.premisses,
#           'conclusion': getProofResponse.conclusion,
#           'is_closed': getProofResponse.is_closed,
#           'theorem':getProofResponse.theorem,
#           'latex_theorem': getProofResponse.latex_theorem,
            'colored_latex': getProofResponse.colored_latex,
#           'counter_examples': getProofResponse.counter_examples,
        }

        print(5, getProofResponse)
        print(4, repr(getProofResponse))
        converted = to_js(getProofResponse, create_pyproxies=False, dict_converter=js.Object.fromEntries)
        print(3, converted)
    except e:
        print(2, e)
        getProofResponse = None
    ret = (textResponse, converted)    
    print("1", ret)
    ret = to_js(ret, create_pyproxies=False, dict_converter=js.Object.fromEntries)
    print(7, ret)
    return ret

"ok"