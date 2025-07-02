try:
    import js # type: ignore
    from pyodide.ffi import to_js # type: ignore
    from anita.anita_pt_fo import check_proof, ParserAnita
except e: # type: ignore
    print("failed import", e) # type: ignore
    raise e # type: ignore
 

def my_check_proof(inp):
    try:
        if inp == "start":
            return to_js("start")
    except e:
        print("failed start", inp)
        raise e
        
    try:
        textResponse = check_proof(inp, None, True, True, False)
    except Exception as e:
        print("failed check_proof", e)
        return str(e)
    except e:
        print("failed check_proof 2")
        raise e
    
    try:
        getProofResponse = ParserAnita.getProof(inp)
    except Exception as e:
        print("failed ParserAnita.getProof", e)
        getProofResponse = None
    except e:
        print("failed ParserAnita.getProof2", e)
        raise e

    print(6, getProofResponse) 

    if getProofResponse:
        try:
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
            converted = to_js(getProofResponse, create_pyproxies=False, dict_converter=js.Object.fromEntries)
            print(3, converted)
        except Exception as e:
            print("failed getProofResponse", e)
            getProofResponse = None
        except e:
            print("failed getProofResponse2", e)
            raise e
        ret = (textResponse, converted)    
    else:
        ret = textResponse

    print(1, ret)

    try:
        ret = to_js(ret, create_pyproxies=False, dict_converter=js.Object.fromEntries)
    except Exception as e:
        print("failed to_js", e)
        return str(e)
    except e:
        print("failed to_js2", e)
        raise e

    print(7, ret)
    return ret

"ok"