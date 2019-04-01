import React from "react";
import { shallow } from "enzyme";
import Layout from '../../../components/Layout/Layout'

describe("Layout render", () => {
  it("Should render Layout component without crashing", () => {
    shallow(<Layout />);
  });

  it("Should match Layout component snapshot", () => {
    const wrapper = shallow(<Layout />);
    expect(wrapper).toMatchSnapshot();
  });
});