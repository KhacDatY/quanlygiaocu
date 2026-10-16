package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.response.ProposalResponse;
import com.example.quanly_giaocu.entity.Proposal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProposalMapper {
    @Mapping(source = "creator.fullName", target = "creatorName")
    @Mapping(source = "creator.position", target = "creatorPosition")
    @Mapping(source = "creator.group.name", target = "creatorGroupName") // THÊM DÒNG NÀY
    ProposalResponse toProposalResponse(Proposal proposal);
}